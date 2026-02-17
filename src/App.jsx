import { useState, useEffect } from "react";

// URL base de la API del challenge
const BASE_URL =
  "https://botfilter-h5ddh6dye8exb7ha.centralus-01.azurewebsites.net";

// Traigo los datos del candidato usando el email
// Lo separo en un hook para no mezclar lógica con la UI
function useCandidate(email) {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!email) return;
    setLoading(true);
    setError(null);

    fetch(
      `${BASE_URL}/api/candidate/get-by-email?email=${encodeURIComponent(email)}`
    )
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(d));
        return res.json();
      })
      .then((data) => setCandidate(data))
      .catch((err) =>
        setError(err?.message || "No se pudieron cargar los datos del candidato.")
      )
      .finally(() => setLoading(false));
  }, [email]);

  return { candidate, loading, error };
}

// Hook para traer la lista de posiciones disponibles
function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/jobs/get-list`)
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(d));
        return res.json();
      })
      .then((data) => setJobs(data))
      .catch((err) =>
        setError(err?.message || "No se pudieron cargar las posiciones.")
      )
      .finally(() => setLoading(false));
  }, []);

  return { jobs, loading, error };
}

// Cada posición es una card independiente con su propio estado
// Así si hay varias posiciones, cada una maneja su submit por separado
function JobCard({ job, candidate }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    // Valido antes de hacer el POST
    if (!candidate) {
      setStatus("error");
      setMessage("Los datos del candidato aún no cargaron. Esperá un momento.");
      return;
    }

    if (!repoUrl.startsWith("https://github.com/")) {
      setStatus("error");
      setMessage("Ingresá una URL válida de GitHub.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`${BASE_URL}/api/candidate/apply-to-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid: candidate.uuid,
          jobId: job.id,
          candidateId: candidate.candidateId,
          repoUrl,
        }),
      });

      const data = await res.json();

      // Si la respuesta no es ok, tiro el mensaje que manda la API
      if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);

      if (data?.ok) {
        setStatus("success");
        setMessage("¡Postulación enviada! 🎉");
      } else {
        throw new Error(data?.message || "Respuesta inesperada del servidor.");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Algo salió mal. Intentá de nuevo.");
    }
  };

  return (
    <article style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.tag}>Posición abierta</span>
        <h2 style={styles.cardTitle}>{job.title}</h2>
        <p style={styles.cardId}>ID: {job.id}</p>
      </div>

      <div>
        <label style={styles.label} htmlFor={`repo-${job.id}`}>
          URL del repositorio en GitHub
        </label>

        <div style={styles.inputRow}>
          <input
            id={`repo-${job.id}`}
            type="url"
            style={{
              ...styles.input,
              ...(status === "error" ? styles.inputError : {}),
              ...(status === "success" ? styles.inputSuccess : {}),
            }}
            placeholder="https://github.com/tu-usuario/tu-repo"
            value={repoUrl}
            onChange={(e) => {
              setRepoUrl(e.target.value);
              // Limpio el error cuando el usuario empieza a escribir de nuevo
              if (status !== "idle") {
                setStatus("idle");
                setMessage("");
              }
            }}
            disabled={status === "loading" || status === "success"}
          />

          <button
            style={{
              ...styles.button,
              ...(status === "success" ? styles.buttonSuccess : {}),
              ...(status === "loading" ||
              status === "success" ||
              !repoUrl.trim()
                ? styles.buttonDisabled
                : {}),
            }}
            onClick={handleSubmit}
            disabled={
              status === "loading" || status === "success" || !repoUrl.trim()
            }
          >
            {status === "loading"
              ? "Enviando..."
              : status === "success"
              ? "✓ Enviado"
              : "Submit"}
          </button>
        </div>

        {/* Muestro feedback solo cuando hay algo que decirle al usuario */}
        {message && (
          <p
            style={
              status === "success"
                ? styles.feedbackSuccess
                : styles.feedbackError
            }
          >
            {message}
          </p>
        )}
      </div>
    </article>
  );
}

export default function App() {
  // Mi email para traer los datos del candidato desde la API
  const EMAIL = "danielahomobono81@gmail.com";

  const { candidate, loading: candLoading, error: candError } =
    useCandidate(EMAIL);
  const { jobs, loading: jobsLoading, error: jobsError } = useJobs();

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <p style={styles.eyebrow}>Nimble Gravity · Challenge</p>
          <h1 style={styles.title}>
            Posiciones <span style={styles.accent}>abiertas</span>
          </h1>
          <p style={styles.subtitle}>
            Seleccioná la posición, ingresá tu repo de GitHub y hacé Submit.
          </p>
        </header>

        {/* Info del candidato */}
        {candLoading && (
          <div style={styles.pill}>⏳ Cargando datos del candidato...</div>
        )}
        {candError && (
          <div style={{ ...styles.pill, ...styles.pillError }}>
            ⚠ {candError}
          </div>
        )}
        {candidate && (
          <div style={styles.pill}>
            <span style={styles.dot} />
            <strong>
              {candidate.firstName} {candidate.lastName}
            </strong>
            <span style={styles.pillEmail}>{candidate.email}</span>
          </div>
        )}

        {/* Lista de posiciones */}
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>Posiciones disponibles</span>
          {!jobsLoading && !jobsError && (
            <span style={styles.count}>{jobs.length} disponibles</span>
          )}
        </div>

        {/* Skeleton mientras carga */}
        {jobsLoading && (
          <>
            <div style={styles.skeleton} />
            <div style={{ ...styles.skeleton, opacity: 0.4 }} />
          </>
        )}

        {jobsError && (
          <div style={styles.stateBox}>
            <p style={styles.stateIcon}>⚠️</p>
            <p style={styles.stateTitle}>No se pudieron cargar las posiciones</p>
            <p style={styles.stateDesc}>{jobsError}</p>
          </div>
        )}

        {!jobsLoading && !jobsError && jobs.length === 0 && (
          <div style={styles.stateBox}>
            <p style={styles.stateIcon}>📭</p>
            <p style={styles.stateTitle}>No hay posiciones disponibles</p>
          </div>
        )}

        {!jobsLoading &&
          jobs.map((job) => (
            <JobCard key={job.id} job={job} candidate={candidate} />
          ))}

        <footer style={styles.footer}>
          Daniela Homobono · Nimble Gravity Challenge · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}

// Todos los estilos juntos al final para tener el componente más limpio arriba
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0d11",
    color: "#e8ecf4",
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    padding: "0 16px",
  },
  container: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "48px 0 80px",
  },
  header: { marginBottom: "40px" },
  eyebrow: {
    fontSize: "11px",
    letterSpacing: "3px",
    textTransform: "uppercase",
    color: "#5b8af7",
    marginBottom: "12px",
  },
  title: {
    fontSize: "clamp(28px, 5vw, 40px)",
    fontWeight: "700",
    letterSpacing: "-1px",
    marginBottom: "10px",
  },
  accent: { color: "#5b8af7" },
  subtitle: { color: "#6b7595", fontSize: "15px", lineHeight: "1.6" },

  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    background: "#13161e",
    border: "1px solid #1f2433",
    borderRadius: "999px",
    padding: "8px 16px",
    marginBottom: "36px",
    fontSize: "13px",
  },
  pillError: { borderColor: "#f04a4a", color: "#f04a4a" },
  pillEmail: {
    color: "#6b7595",
    fontSize: "12px",
    fontFamily: "monospace",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#22c55e",
    flexShrink: 0,
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  sectionLabel: {
    fontSize: "11px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: "#6b7595",
  },
  count: {
    fontSize: "12px",
    background: "#1e2d54",
    color: "#5b8af7",
    borderRadius: "4px",
    padding: "2px 8px",
    fontFamily: "monospace",
  },

  card: {
    background: "#13161e",
    border: "1px solid #1f2433",
    borderRadius: "12px",
    padding: "28px",
    marginBottom: "16px",
  },
  cardHeader: { marginBottom: "24px" },
  tag: {
    display: "inline-block",
    fontSize: "10px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: "#22c55e",
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.2)",
    borderRadius: "4px",
    padding: "3px 10px",
    marginBottom: "10px",
  },
  cardTitle: {
    fontSize: "22px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    marginBottom: "4px",
  },
  cardId: { fontSize: "11px", color: "#6b7595", fontFamily: "monospace" },

  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    color: "#6b7595",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  inputRow: { display: "flex", gap: "10px" },
  input: {
    flex: 1,
    background: "#0b0d11",
    border: "1px solid #1f2433",
    borderRadius: "8px",
    color: "#e8ecf4",
    fontFamily: "monospace",
    fontSize: "13px",
    padding: "12px 14px",
    outline: "none",
  },
  inputError: { borderColor: "#f04a4a" },
  inputSuccess: { borderColor: "#22c55e" },

  button: {
    background: "#5b8af7",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    padding: "12px 22px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    minWidth: "100px",
  },
  buttonSuccess: { background: "#22c55e" },
  buttonDisabled: { opacity: 0.5, cursor: "not-allowed" },

  feedbackSuccess: {
    marginTop: "10px",
    fontSize: "13px",
    color: "#22c55e",
    background: "rgba(34,197,94,0.07)",
    border: "1px solid rgba(34,197,94,0.2)",
    borderRadius: "6px",
    padding: "8px 12px",
  },
  feedbackError: {
    marginTop: "10px",
    fontSize: "13px",
    color: "#f04a4a",
    background: "rgba(240,74,74,0.07)",
    border: "1px solid rgba(240,74,74,0.2)",
    borderRadius: "6px",
    padding: "8px 12px",
  },

  skeleton: {
    background:
      "linear-gradient(90deg, #13161e 25%, #1f2433 50%, #13161e 75%)",
    backgroundSize: "200% 100%",
    borderRadius: "12px",
    height: "140px",
    marginBottom: "16px",
  },

  stateBox: {
    background: "#13161e",
    border: "1px solid #1f2433",
    borderRadius: "12px",
    padding: "48px",
    textAlign: "center",
  },
  stateIcon: { fontSize: "32px", marginBottom: "12px" },
  stateTitle: { fontSize: "17px", fontWeight: "600", marginBottom: "6px" },
  stateDesc: { fontSize: "13px", color: "#6b7595", fontFamily: "monospace" },

  footer: {
    marginTop: "64px",
    paddingTop: "24px",
    borderTop: "1px solid #1f2433",
    fontSize: "11px",
    color: "#6b7595",
    textAlign: "center",
    letterSpacing: "1px",
    fontFamily: "monospace",
  },
};