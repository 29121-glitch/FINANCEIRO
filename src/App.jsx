import { useEffect, useMemo, useState } from "react";
import "./App.css";

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dataAtual = () => {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(
    hoje.getMonth() + 1
  ).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
};

const dataExibida = (data) => {
  if (!data) return "—";
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
};

function lerDados() {
  try {
    return JSON.parse(
      localStorage.getItem("mensalidades-escolares") || "[]"
    );
  } catch {
    return [];
  }
}

function App() {
  const [mensalidades, setMensalidades] = useState(lerDados);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todas");
  const [mensagem, setMensagem] = useState("");

  const [form, setForm] = useState({
    aluno: "",
    turma: "",
    valor: "",
    vencimento: dataAtual(),
  });

  useEffect(() => {
    localStorage.setItem(
      "mensalidades-escolares",
      JSON.stringify(mensalidades)
    );
  }, [mensalidades]);

  function situacao(item) {
    if (item.pago) return "Paga";
    if (item.vencimento < dataAtual()) return "Vencida";
    return "Pendente";
  }

  const resumo = useMemo(() => {
    return mensalidades.reduce(
      (total, item) => {
        const status = situacao(item);

        total.cadastradas++;
        if (status === "Paga") {
          total.recebido += Number(item.valor);
          total.pagas++;
        } else {
          total.pendente += Number(item.valor);
          total.abertas++;
        }

        if (status === "Vencida") total.vencidas++;
        return total;
      },
      {
        cadastradas: 0,
        recebido: 0,
        pendente: 0,
        pagas: 0,
        abertas: 0,
        vencidas: 0,
      }
    );
  }, [mensalidades]);

  const filtradas = useMemo(() => {
    return mensalidades.filter((item) => {
      const termo = busca.toLowerCase().trim();

      const correspondeBusca =
        item.aluno.toLowerCase().includes(termo) ||
        item.turma.toLowerCase().includes(termo);

      const status = situacao(item);
      const correspondeFiltro =
        filtro === "Todas" || status === filtro;

      return correspondeBusca && correspondeFiltro;
    });
  }, [mensalidades, busca, filtro]);

  function atualizarCampo(evento) {
    const { name, value } = evento.target;
    setForm((anterior) => ({ ...anterior, [name]: value }));
  }

  function cadastrar(evento) {
    evento.preventDefault();

    const valor = Number(form.valor.replace(",", "."));

    if (!form.aluno.trim() || !form.turma.trim()) {
      setMensagem("Preencha o nome do aluno e a turma.");
      return;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      setMensagem("Informe um valor válido maior que zero.");
      return;
    }

    if (!form.vencimento) {
      setMensagem("Informe a data de vencimento.");
      return;
    }

    const novaMensalidade = {
      id: crypto.randomUUID(),
      aluno: form.aluno.trim(),
      turma: form.turma.trim(),
      valor,
      vencimento: form.vencimento,
      pago: false,
      criadoEm: new Date().toISOString(),
    };

    setMensalidades((anterior) => [
      novaMensalidade,
      ...anterior,
    ]);

    setForm({
      aluno: "",
      turma: "",
      valor: "",
      vencimento: dataAtual(),
    });

    setMensagem("Mensalidade cadastrada com sucesso!");
  }

  function registrarPagamento(id) {
    const item = mensalidades.find((m) => m.id === id);

    if (!item || item.pago) return;

    const confirmar = window.confirm(
      `Confirmar o pagamento de ${moeda.format(Number(item.valor))} para ${item.aluno}?`
    );

    if (!confirmar) return;

    setMensalidades((anterior) =>
      anterior.map((m) =>
        m.id === id
          ? {
              ...m,
              pago: true,
              pagoEm: new Date().toISOString(),
            }
          : m
      )
    );

    setMensagem("Pagamento registrado com sucesso!");
  }

  function excluir(id) {
    const item = mensalidades.find((m) => m.id === id);
    if (!item) return;

    if (item.pago) {
      setMensagem("Não é possível excluir um pagamento confirmado.");
      return;
    }

    if (!window.confirm(`Excluir a mensalidade de ${item.aluno}?`)) {
      return;
    }

    setMensalidades((anterior) =>
      anterior.filter((m) => m.id !== id)
    );
    setMensagem("Mensalidade excluída.");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">F</div>
          <div>
            <strong>Financeiro</strong>
            <span>Gestão escolar</span>
          </div>
        </div>

        <div className="menu-label">MENU PRINCIPAL</div>
        <a className="menu-item active" href="#painel">
          <span>▦</span> Painel financeiro
        </a>
        <a className="menu-item" href="#cadastro">
          <span>＋</span> Nova mensalidade
        </a>
        <a className="menu-item" href="#mensalidades">
          <span>▤</span> Mensalidades
        </a>

        <div className="sidebar-bottom">
          <div className="school-mark">CE</div>
          <div>
            <strong>Colégio Escolar</strong>
            <span>Setor financeiro</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">GESTÃO ESCOLAR / FINANCEIRO</span>
            <h1>Painel financeiro</h1>
            <p>Acompanhe as mensalidades e os pagamentos do colégio.</p>
          </div>
          <div className="today">
            <span>Hoje</span>
            <strong>{new Date().toLocaleDateString("pt-BR")}</strong>
          </div>
        </header>

        <section className="stats" id="painel">
          <article className="stat-card">
            <div className="stat-top">
              <span>Total recebido</span>
              <div className="stat-icon green">R$</div>
            </div>
            <strong className="stat-value">
              {moeda.format(resumo.recebido)}
            </strong>
            <span className="stat-note">
              {resumo.pagas} mensalidade(s) paga(s)
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Em aberto</span>
              <div className="stat-icon orange">↗</div>
            </div>
            <strong className="stat-value">
              {moeda.format(resumo.pendente)}
            </strong>
            <span className="stat-note">
              {resumo.abertas} mensalidade(s) não paga(s)
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Mensalidades vencidas</span>
              <div className="stat-icon red">!</div>
            </div>
            <strong className="stat-value">{resumo.vencidas}</strong>
            <span className="stat-note">Precisam de atenção</span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Total de registros</span>
              <div className="stat-icon blue">▤</div>
            </div>
            <strong className="stat-value">{resumo.cadastradas}</strong>
            <span className="stat-note">Mensalidades cadastradas</span>
          </article>
        </section>

        {mensagem && (
          <div className="notice" role="status">
            <span>{mensagem}</span>
            <button
              className="notice-close"
              onClick={() => setMensagem("")}
              aria-label="Fechar mensagem"
            >
              ×
            </button>
          </div>
        )}

        <section className="panel" id="cadastro">
          <div className="section-heading">
            <div>
              <span className="eyebrow">NOVO REGISTRO</span>
              <h2>Cadastrar mensalidade</h2>
            </div>
            <span className="section-symbol">＋</span>
          </div>

          <form onSubmit={cadastrar}>
            <div className="form-grid">
              <label>
                Nome do aluno
                <input
                  name="aluno"
                  value={form.aluno}
                  onChange={atualizarCampo}
                  placeholder="Ex.: Maria Oliveira"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Turma
                <input
                  name="turma"
                  value={form.turma}
                  onChange={atualizarCampo}
                  placeholder="Ex.: 8º ano A"
                  maxLength={40}
                  required
                />
              </label>

              <label>
                Valor da mensalidade (R$)
                <input
                  name="valor"
                  type="text"
                  inputMode="decimal"
                  value={form.valor}
                  onChange={atualizarCampo}
                  placeholder="Ex.: 850,00"
                  required
                />
              </label>

              <label>
                Data de vencimento
                <input
                  name="vencimento"
                  type="date"
                  value={form.vencimento}
                  onChange={atualizarCampo}
                  required
                />
              </label>
            </div>

            <div className="form-footer">
              <span>Os campos marcados são obrigatórios.</span>
              <button className="primary-button" type="submit">
                + Cadastrar mensalidade
              </button>
            </div>
          </form>
        </section>

        <section className="panel table-panel" id="mensalidades">
          <div className="section-heading table-heading">
            <div>
              <span className="eyebrow">CONTROLE DE RECEBIMENTOS</span>
              <h2>Mensalidades cadastradas</h2>
              <p>Consulte pendências e confirme os pagamentos.</p>
            </div>
            <span className="count-badge">{filtradas.length} registro(s)</span>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <span>⌕</span>
              <input
                aria-label="Buscar aluno ou turma"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar aluno ou turma..."
              />
            </div>

            <select
              aria-label="Filtrar por situação"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            >
              <option>Todas</option>
              <option>Paga</option>
              <option>Pendente</option>
              <option>Vencida</option>
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ALUNO</th>
                  <th>TURMA</th>
                  <th>VALOR</th>
                  <th>VENCIMENTO</th>
                  <th>SITUAÇÃO</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((item) => {
                  const status = situacao(item);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="student">
                          <div className="avatar">
                            {item.aluno.charAt(0).toUpperCase()}
                          </div>
                          <strong>{item.aluno}</strong>
                        </div>
                      </td>
                      <td>{item.turma}</td>
                      <td className="amount">
                        {moeda.format(Number(item.valor))}
                      </td>
                      <td>{dataExibida(item.vencimento)}</td>
                      <td>
                        <span
                          className={`status status-${status.toLowerCase()}`}
                        >
                          <span className="status-dot" />
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          {!item.pago && (
                            <button
                              className="pay-button"
                              onClick={() => registrarPagamento(item.id)}
                            >
                              Receber
                            </button>
                          )}
                          {!item.pago && (
                            <button
                              className="delete-button"
                              onClick={() => excluir(item.id)}
                              title="Excluir mensalidade"
                              aria-label={`Excluir mensalidade de ${item.aluno}`}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtradas.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty">
                      <div className="empty-icon">▤</div>
                      <strong>Nenhuma mensalidade encontrada</strong>
                      <span>
                        Cadastre uma mensalidade ou altere os filtros.
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>
              Exibindo {filtradas.length} de {mensalidades.length} registro(s)
            </span>
            <span>Dados armazenados neste navegador</span>
          </div>
        </section>

        <footer className="footer">
          Sistema Financeiro Escolar · Projeto demonstrativo em React
        </footer>
      </main>
    </div>
  );
}

export default App;