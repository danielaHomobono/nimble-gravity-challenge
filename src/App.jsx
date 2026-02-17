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
          applicationId: candidate.applicationId,
          repoUrl,
        }),
      });

      const data = await res.json();

      // Si la respuesta no es ok, muestro el mensaje que devuelve la API
      if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);

      if (data?.ok) {
        setStatus("success");
        setMessage("Postulacion enviada con exito!");
      } else {
        throw new Error(data?.message || "Respuesta inesperada del servidor.");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Algo salio mal. Intenta de nuevo.");
    }
  };

  return (
    <article style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.tag}>Posicion abierta</span>
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
              ...(status === "error" ? { borderColor: "#ff6b6b" } : {}),
              ...(status === "success" ? { borderColor: "#51cf66" } : {}),
            }}
            placeholder="https://github.com/tu-usuario/tu-repo"
            value={repoUrl}
            onChange={(e) => {
              setRepoUrl(e.target.value);
              // Limpio el mensaje cuando el usuario empieza a escribir de nuevo
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
              ...(status === "loading" || status === "success" || !repoUrl.trim()
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
              ? "Enviado"
              : "Submit"}
          </button>
        </div>

        {/* Feedback visible solo cuando hay algo que mostrar */}
        {message && (
          <p
            style={
              status === "success" ? styles.feedbackSuccess : styles.feedbackError
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
  const EMAIL = "danielahomobono81@gmail.com";

  const { candidate, loading: candLoading, error: candError } =
    useCandidate(EMAIL);
  const { jobs, loading: jobsLoading, error: jobsError } = useJobs();

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <header style={styles.header}>
          <p style={styles.eyebrow}>Nimble Gravity · Challenge</p>
          <h1 style={styles.title}>
            Posiciones <span style={styles.accent}>abiertas</span>
          </h1>
          <p style={styles.subtitle}>
            Selecciona la posicion, ingresa tu repo de GitHub y hace Submit.
          </p>
        </header>

        {/* Estado del candidato */}
        {candLoading && (
          <div style={styles.pill}>Cargando datos del candidato...</div>
        )}
        {candError && (
          <div style={{ ...styles.pill, borderColor: "#ff6b6b", color: "#ff6b6b" }}>
            {candError}
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

        {/* Encabezado de la sección */}
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>Posiciones disponibles</span>
          {!jobsLoading && !jobsError && (
            <span style={styles.count}>{jobs.length} disponibles</span>
          )}
        </div>

        {/* Skeleton mientras carga la lista */}
        {jobsLoading && (
          <>
            <div style={styles.skeleton} />
            <div style={{ ...styles.skeleton, opacity: 0.4 }} />
          </>
        )}

        {jobsError && (
          <div style={styles.stateBox}>
            <p style={styles.stateTitle}>No se pudieron cargar las posiciones</p>
            <p style={styles.stateDesc}>{jobsError}</p>
          </div>
        )}

        {!jobsLoading && !jobsError && jobs.length === 0 && (
          <div style={styles.stateBox}>
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

// Estilos al final para mantener el componente limpio arriba
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f1117",
    color: "#eaeaea",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
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
    color: "#51cf66",
    marginBottom: "12px",
  },
  title: {
    fontSize: "clamp(28px, 5vw, 40px)",
    fontWeight: "700",
    letterSpacing: "-1px",
    marginBottom: "10px",
  },
  accent: { color: "#51cf66" },
  subtitle: { color: "#868e96", fontSize: "15px", lineHeight: "1.6" },

  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    background: "#1a1d27",
    border: "1px solid #2c2f3e",
    borderRadius: "999px",
    padding: "8px 18px",
    marginBottom: "36px",
    fontSize: "13px",
  },
  pillEmail: {
    color: "#868e96",
    fontSize: "12px",
    fontFamily: "monospace",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#51cf66",
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
    color: "#868e96",
  },
  count: {
    fontSize: "12px",
    background: "#1a2e1a",
    color: "#51cf66",
    borderRadius: "4px",
    padding: "2px 8px",
    fontFamily: "monospace",
  },

  card: {
    background: "#1a1d27",
    border: "1px solid #2c2f3e",
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
    color: "#51cf66",
    background: "rgba(81,207,102,0.08)",
    border: "1px solid rgba(81,207,102,0.25)",
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
  cardId: { fontSize: "11px", color: "#868e96", fontFamily: "monospace" },

  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    color: "#868e96",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  inputRow: { display: "flex", gap: "10px" },
  input: {
    flex: 1,
    background: "#0f1117",
    border: "1px solid #2c2f3e",
    borderRadius: "8px",
    color: "#eaeaea",
    fontFamily: "monospace",
    fontSize: "13px",
    padding: "12px 14px",
    outline: "none",
  },

  button: {
    background: "#51cf66",
    color: "#0f1117",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "700",
    padding: "12px 22px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    minWidth: "100px",
  },
  buttonSuccess: {
    background: "#2f9e44",
    color: "#fff",
  },
  buttonDisabled: { opacity: 0.4, cursor: "not-allowed" },

  feedbackSuccess: {
    marginTop: "10px",
    fontSize: "13px",
    color: "#51cf66",
    background: "rgba(81,207,102,0.07)",
    border: "1px solid rgba(81,207,102,0.2)",
    borderRadius: "6px",
    padding: "8px 12px",
  },
  feedbackError: {
    marginTop: "10px",
    fontSize: "13px",
    color: "#ff6b6b",
    background: "rgba(255,107,107,0.07)",
    border: "1px solid rgba(255,107,107,0.2)",
    borderRadius: "6px",
    padding: "8px 12px",
  },

  skeleton: {
    background:
      "linear-gradient(90deg, #1a1d27 25%, #2c2f3e 50%, #1a1d27 75%)",
    backgroundSize: "200% 100%",
    borderRadius: "12px",
    height: "140px",
    marginBottom: "16px",
  },

  stateBox: {
    background: "#1a1d27",
    border: "1px solid #2c2f3e",
    borderRadius: "12px",
    padding: "48px",
    textAlign: "center",
  },
  stateTitle: { fontSize: "17px", fontWeight: "600", marginBottom: "6px" },
  stateDesc: { fontSize: "13px", color: "#868e96", fontFamily: "monospace" },

  footer: {
    marginTop: "64px",
    paddingTop: "24px",
    borderTop: "1px solid #2c2f3e",
    fontSize: "11px",
    color: "#868e96",
    textAlign: "center",
    letterSpacing: "1px",
    fontFamily: "monospace",
  },
};