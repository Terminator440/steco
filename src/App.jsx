import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { DynamicPage } from "./components/DynamicPage";
import { AdminPage } from "./pages/AdminPage";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={
            <DynamicPage
              slug="home"
              defaultTitle="Evenimentul tău, regizat la perfecțiune."
              defaultSubtitle="De la concept la ultima lumânare stinsă, Steco Events este partenerul tău pentru evenimente impecabile."
              sectionTitle="Prezentare generală"
            />
          }
        />

        <Route
          path="/servicii"
          element={
            <DynamicPage
              slug="servicii"
              defaultTitle="Servicii complete pentru orice tip de eveniment."
              defaultSubtitle="Nunți, botezuri, corporate și majorate – fiecare cu identitatea și scenografia proprie."
              sectionTitle="Servicii Steco"
            />
          }
        />

        <Route
          path="/portofoliu"
          element={
            <DynamicPage
              slug="portofoliu"
              defaultTitle="Momente surprinse în imagini."
              defaultSubtitle="O selecție de evenimente care ne definesc stilul: elegant, cald, atent la detalii."
              sectionTitle="Portofoliu foto"
            />
          }
        />

        <Route
          path="/contact"
          element={
            <DynamicPage
              slug="contact"
              defaultTitle="Hai să povestim despre evenimentul tău."
              defaultSubtitle="Completează formularul de mai jos și îți răspundem cu o propunere personalizată."
              sectionTitle="Contact"
            />
          }
        />

        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

