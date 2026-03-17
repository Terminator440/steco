import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { DynamicPage } from "./components/DynamicPage";

const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((module) => ({ default: module.AdminPage }))
);

export default function App() {
  return (
    <div className="min-h-screen bg-black text-slate-50">
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

        <Route
          path="/misiunea-noastra"
          element={
            <DynamicPage
              slug="misiunea-noastra"
              defaultTitle="Misiunea noastră."
              defaultSubtitle="Descoperă principiile și valorile care stau la baza fiecărui eveniment organizat de Steco."
              sectionTitle="Misiunea noastră"
            />
          }
        />

        <Route
          path="/participanti"
          element={
            <DynamicPage
              slug="participanti"
              defaultTitle="Participanți și invitați."
              defaultSubtitle="Galerie cu persoanele care ne-au fost alături în evenimentele Steco."
              sectionTitle="Participanți"
            />
          }
        />

        <Route
          path="/admin"
          element={
            <Suspense
              fallback={
                <main className="min-h-screen bg-black px-4 pt-24 text-center text-sm text-slate-300">
                  Se încarcă panoul de administrare...
                </main>
              }
            >
              <AdminPage />
            </Suspense>
          }
        />
      </Routes>
    </div>
  );
}

