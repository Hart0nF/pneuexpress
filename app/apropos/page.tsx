export default function AproposPage() {
  return (
    <div className="apropos-container">
      <h1 className="apropos-title">À propos</h1>

      <div className="apropos-table">
        <div className="apropos-row"><strong>Félix Harton</strong></div>
        <div className="apropos-row"><strong>Programmation Avancé</strong></div>
         <div className="apropos-row"><strong>Travail Pratique Synthèse</strong></div>
        <div className="apropos-row">
          <span className="apropos-tech"><strong>Visual Studio Code: </strong></span>
          <span className="apropos-version">1.106.3</span>
        </div>

        <div className="apropos-row">
          <span className="apropos-tech"><strong>Next.js: </strong></span>
          <span className="apropos-version">16.0.8</span>
        </div>

        <div className="apropos-row dernier">
          <span className="apropos-tech"><strong>Node modules: </strong></span>
          <span className="apropos-version">22.20.0</span>
        </div>
      </div>
    </div>
  );
}
