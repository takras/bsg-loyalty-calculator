import Head from "next/head";
import styles from "../styles/Home.module.css";
import SuccessionPage from "./succession";
import { SettingsProvider } from "../settings/settings-provider";
import useCategoryButtons from "../hooks/use-categories";
import useExpansions from "../hooks/use-expansions";
import DiceHitsPage from "./dice";
import Link from "next/link";

export default function Home() {
  const { CategoryButtons, selectedCategory } = useCategoryButtons();
  const { ExpansionButtons, enabledBoxes } = useExpansions();

  return (
    <div className={styles.container}>
      <Head>
        <title>Battlestar Galactica Boardgame Helper</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav>
        <Link href="/succession">Succession</Link>
        <Link href="/dice">Dice Hits</Link>
      </nav>

      <SettingsProvider value={{ selectedCategory, enabledBoxes }}>
        <menu>
          <CategoryButtons />
          <ExpansionButtons />
        </menu>
        <main>
          <SuccessionPage />
          <DiceHitsPage />
        </main>
      </SettingsProvider>

      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <img src="/vercel.svg" alt="Vercel" className={styles.logo} />
        </a>
      </footer>

      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        footer img {
          margin-left: 0.5rem;
        }
        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
