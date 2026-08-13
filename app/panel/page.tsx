"use client";

import "./panel-v3.css";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

type Business = {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  type?: string | null;
  description?: string | null;
  address?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  schedule?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: string | null;
  accent?: string | null;
};

type Tab =
  | "overview"
  | "ranking"
  | "growth"
  | "marketing"
  | "analytics"
  | "premium";

function categoryName(category?: string | null) {
  const names: Record<string, string> = {
    gastronomia: "Gastronomía",
    belleza: "Belleza",
    profesionales: "Profesionales",
    automotor: "Automotor",
    calzado: "Calzado",
    comercio: "Comercio",
    servicios: "Servicios",
    salud: "Salud",
    hogar: "Hogar",
  };

  return names[category || ""] || category || "Comercio local";
}

function completion(business: Business) {
  const values = [
    business.name,
    business.category,
    business.description,
    business.address,
    business.whatsapp,
    business.schedule,
    business.latitude,
    business.longitude,
  ];

  return Math.round(
    (values.filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
    ).length /
      values.length) *
      100
  );
}

function getLevel(score: number) {
  if (score >= 95) return "LÍDER LOCAL";
  if (score >= 80) return "DESTACADO";
  if (score >= 60) return "ACTIVO";
  return "INICIAL";
}

function getLevelColor(score: number) {
  if (score >= 95) return "gold";
  if (score >= 80) return "purple";
  if (score >= 60) return "cyan";
  return "gray";
}

export default function PanelV3() {
  const [session, setSession] = useState<Session | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedBusiness, setSelectedBusiness] =
    useState<string>("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "premium" | null>(null);

  function openPlan(plan: "pro" | "premium") {
    setSelectedPlan(plan);
    setShowUpgrade(true);
  }


  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data, error: sessionError } =
          await supabase().auth.getSession();

        if (sessionError) throw sessionError;

        if (!data.session) {
          window.location.href = "/login";
          return;
        }

        if (!mounted) return;

        setSession(data.session);

        const { data: rows, error: businessError } =
          await supabase()
            .from("businesses")
            .select(
              "id,name,slug,category,type,description,address,whatsapp,instagram,schedule,latitude,longitude,status,accent"
            )
            .eq("owner_id", data.session.user.id)
            .order("created_at", {
              ascending: false,
            });

        if (businessError) throw businessError;

        if (!mounted) return;

        const list = (rows as Business[]) || [];

        setBusinesses(list);

        if (list.length) {
          setSelectedBusiness(list[0].id);
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError(
            "No pudimos cargar tu información. Revisá la conexión con Supabase."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const business =
    businesses.find((item) => item.id === selectedBusiness) ||
    businesses[0];

  const score = business ? completion(business) : 0;

  const level = getLevel(score);
  const levelColor = getLevelColor(score);

  const category = categoryName(business?.category);

  const visibilityScore = Math.min(
    99,
    Math.max(
      18,
      score +
        (business?.latitude ? 4 : 0) +
        (business?.whatsapp ? 3 : 0)
    )
  );

  const rankingPosition = businesses.length
    ? Math.max(
        1,
        Math.round(
          17 -
            visibilityScore / 8
        )
      )
    : 0;

  const points =
    visibilityScore * 37 +
    (business?.description ? 120 : 0) +
    (business?.whatsapp ? 80 : 0) +
    (business?.latitude ? 100 : 0);

  const nextLevel =
    visibilityScore >= 95
      ? 100
      : visibilityScore >= 80
        ? 95
        : visibilityScore >= 60
          ? 80
          : 60;

  const pointsToNext = Math.max(
    0,
    (nextLevel - visibilityScore) * 20
  );

  const missions = [
    {
      title: "Completá tu descripción",
      description:
        "Contales a los clientes qué hace diferente a tu negocio.",
      reward: "+120 puntos",
      done: Boolean(business?.description),
      icon: "✦",
    },
    {
      title: "Activá WhatsApp",
      description:
        "Convertí visitas del directorio en conversaciones.",
      reward: "+80 puntos",
      done: Boolean(business?.whatsapp),
      icon: "◉",
    },
    {
      title: "Marcá tu ubicación",
      description:
        "Aparecé correctamente en el mapa local.",
      reward: "+100 puntos",
      done: Boolean(
        business?.latitude &&
          business?.longitude
      ),
      icon: "⌖",
    },
    {
      title: "Completá tus horarios",
      description:
        "Ayudá a los clientes a saber cuándo visitarte.",
      reward: "+70 puntos",
      done: Boolean(business?.schedule),
      icon: "◷",
    },
  ];

  const achievements = [
    {
      icon: "⚡",
      title: "Primer negocio",
      description: "Publicaste tu primera ficha.",
      unlocked: businesses.length > 0,
    },
    {
      icon: "⌖",
      title: "Presencia local",
      description: "Tu negocio está ubicado en el mapa.",
      unlocked: Boolean(
        business?.latitude &&
          business?.longitude
      ),
    },
    {
      icon: "◉",
      title: "Contacto directo",
      description: "Tenés WhatsApp disponible.",
      unlocked: Boolean(business?.whatsapp),
    },
    {
      icon: "✦",
      title: "Perfil completo",
      description: "Tu ficha alcanzó el 100%.",
      unlocked: score === 100,
    },
    {
      icon: "🏆",
      title: "Negocio destacado",
      description: "Alcanzá 80 puntos de visibilidad.",
      unlocked: visibilityScore >= 80,
    },
    {
      icon: "👑",
      title: "Líder local",
      description: "Alcanzá el máximo nivel.",
      unlocked: visibilityScore >= 95,
    },
  ];

  const tabs = [
    ["overview", "Resumen"],
    ["ranking", "Ranking"],
    ["growth", "Crecimiento"],
    ["marketing", "Marketing"],
    ["analytics", "Estadísticas"],
    ["premium", "Premium"],
  ] as const;

  if (loading) {
    return (
      <main className="v3-loading">
        <div className="v3-loader" />
        <strong>Preparando tu centro de control</strong>
        <span>Estamos cargando San Lorenzo Digital.</span>
      </main>
    );
  }

  if (error) {
    return (
      <main className="v3-page">
        <div className="v3-error">
          <div>!</div>
          <h1>No pudimos cargar el panel</h1>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="v3-page">

      <div className="v3-background v3-bg-one" />
      <div className="v3-background v3-bg-two" />

      <header className="v3-header">

        <a href="/" className="v3-logo">
          <div className="v3-logo-mark">
            SL
          </div>

          <div>
            <strong>SAN LORENZO</strong>
            <span>DIGITAL</span>
          </div>
        </a>

        <nav className="v3-navigation">
          <a href="/">Inicio</a>
          <a href="/negocios">Negocios</a>
          <a href="/categorias">Categorías</a>
          <a href="/mapa">Mapa</a>
          <a href="/para-negocios">Para negocios</a>
        </nav>

        <div className="v3-header-right">

          <span className="v3-email">
            {session?.user.email}
          </span>

          <a href="/" className="v3-public-button">
            Ver sitio
          </a>

        </div>
      </header>

      <div className="v3-container">

        <section className="v3-welcome">

          <div>
            <span className="v3-eyebrow">
              CENTRO DE CONTROL · 2026
            </span>

            <h1>
              Hacé crecer
              <br />
              <span>tu negocio.</span>
            </h1>

            <p>
              Tu presencia en San Lorenzo Digital no termina
              cuando publicás tu ficha. Acá podés mejorarla,
              competir por visibilidad y convertir visitas
              en clientes.
            </p>
          </div>

          <div className="v3-welcome-actions">

            <button
              className="v3-primary"
              onClick={() =>
                (window.location.href =
                  "/dashboard/editar/" +
                  business?.slug)
              }
            >
              Mejorar mi perfil
              <span>→</span>
            </button>

            <button
              className="v3-secondary"
              onClick={() =>
                setShowUpgrade(true)
              }
            >
              ⚡ Ver oportunidades
            </button>

          </div>

        </section>

        {businesses.length > 0 && (
          <section className="v3-business-switcher">

            <div>
              <span className="v3-label">
                NEGOCIO ACTIVO
              </span>

              <strong>
                {business?.name}
              </strong>

              <span>
                {category}
              </span>
            </div>

            {businesses.length > 1 && (
              <select
                value={business?.id || ""}
                onChange={(event) =>
                  setSelectedBusiness(
                    event.target.value
                  )
                }
              >
                {businesses.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            )}

          </section>
        )}

        <nav className="v3-tabs">

          {tabs.map(([value, label]) => (
            <button
              key={value}
              className={
                tab === value
                  ? "active"
                  : ""
              }
              onClick={() =>
                setTab(value)
              }
            >
              {label}

              {value === "premium" && (
                <span className="v3-new">
                  PRO
                </span>
              )}
            </button>
          ))}

        </nav>

        {tab === "overview" && (
          <>

            <section className="v3-score-grid">

              <article className="v3-score-card main">

                <div className="v3-score-top">

                  <div>
                    <span className="v3-label">
                      VISIBILIDAD
                    </span>

                    <div className="v3-score-number">
                      {visibilityScore}
                      <small>/100</small>
                    </div>

                    <span
                      className={`v3-level ${levelColor}`}
                    >
                      {level}
                    </span>
                  </div>

                  <div className="v3-score-ring">
                    <div
                      style={{
                        "--score":
                          `${visibilityScore * 3.6}deg`,
                      } as React.CSSProperties}
                    >
                      <strong>
                        {visibilityScore}
                      </strong>
                    </div>
                  </div>

                </div>

                <div className="v3-progress">
                  <span
                    style={{
                      width:
                        `${visibilityScore}%`,
                    }}
                  />
                </div>

                <div className="v3-score-footer">
                  <span>
                    {pointsToNext > 0
                      ? `${pointsToNext} puntos para el próximo nivel`
                      : "Nivel máximo alcanzado"}
                  </span>

                  <strong>
                    {points.toLocaleString("es-AR")} pts
                  </strong>
                </div>

              </article>

              <article className="v3-stat-card">

                <span className="v3-label">
                  POSICIÓN
                </span>

                <strong>
                  #{rankingPosition}
                </strong>

                <p>
                  En el ranking local
                </p>

                <div className="v3-stat-icon gold">
                  🏆
                </div>

              </article>

              <article className="v3-stat-card">

                <span className="v3-label">
                  VISITAS
                </span>

                <strong>
                  248
                </strong>

                <p>
                  +18% esta semana
                </p>

                <div className="v3-stat-icon cyan">
                  ↗
                </div>

              </article>

              <article className="v3-stat-card">

                <span className="v3-label">
                  CONTACTOS
                </span>

                <strong>
                  37
                </strong>

                <p>
                  Oportunidades generadas
                </p>

                <div className="v3-stat-icon purple">
                  ◉
                </div>

              </article>

            </section>

            <section className="v3-two-column">

              <div>

                <div className="v3-section-title">

                  <div>
                    <span className="v3-label">
                      COMPETENCIA
                    </span>

                    <h2>
                      Tu posición local
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      setTab("ranking")
                    }
                  >
                    Ver ranking →
                  </button>

                </div>

                <div className="v3-ranking-preview">

                  <div className="v3-ranking-row">
                    <span>01</span>
                    <div className="ranking-avatar gold">
                      A
                    </div>
                    <div>
                      <strong>
                        Negocio destacado
                      </strong>
                      <small>
                        Líder local
                      </small>
                    </div>
                    <b>
                      97
                    </b>
                  </div>

                  <div className="v3-ranking-row current">
                    <span>
                      {String(
                        rankingPosition
                      ).padStart(2, "0")}
                    </span>

                    <div className="ranking-avatar purple">
                      {business?.name
                        ?.slice(0, 1)
                        .toUpperCase() ||
                        "T"}
                    </div>

                    <div>
                      <strong>
                        {business?.name ||
                          "Tu negocio"}
                      </strong>
                      <small>
                        {category}
                      </small>
                    </div>

                    <b>
                      {visibilityScore}
                    </b>
                  </div>

                  <div className="v3-ranking-row">
                    <span>03</span>
                    <div className="ranking-avatar cyan">
                      B
                    </div>
                    <div>
                      <strong>
                        Otro negocio local
                      </strong>
                      <small>
                        Activo
                      </small>
                    </div>
                    <b>
                      74
                    </b>
                  </div>

                  <div className="v3-ranking-row">
                    <span>04</span>
                    <div className="ranking-avatar pink">
                      M
                    </div>
                    <div>
                      <strong>
                        Comercio local
                      </strong>
                      <small>
                        En crecimiento
                      </small>
                    </div>
                    <b>
                      68
                    </b>
                  </div>

                </div>

              </div>

              <aside className="v3-opportunity">

                <div className="v3-opportunity-icon">
                  ⚡
                </div>

                <span className="v3-label">
                  OPORTUNIDAD
                </span>

                <h3>
                  Podés subir
                  <br />
                  {Math.max(
                    1,
                    95 - visibilityScore
                  )}{" "}
                  puntos.
                </h3>

                <p>
                  Completando tu perfil y activando
                  herramientas de visibilidad podés
                  acercarte al nivel Líder Local.
                </p>

                <button
                  onClick={() =>
                    setTab("growth")
                  }
                >
                  Ver cómo →
                </button>

              </aside>

            </section>

            <section className="v3-section">

              <div className="v3-section-title">

                <div>
                  <span className="v3-label">
                    PROGRESO
                  </span>

                  <h2>
                    Misiones para crecer
                  </h2>
                </div>

                <span className="v3-points">
                  {points.toLocaleString("es-AR")} puntos
                </span>

              </div>

              <div className="v3-missions">

                {missions.map((mission) => (
                  <article
                    key={mission.title}
                    className={
                      mission.done
                        ? "done"
                        : ""
                    }
                  >

                    <div className="v3-mission-icon">
                      {mission.done
                        ? "✓"
                        : mission.icon}
                    </div>

                    <div>
                      <strong>
                        {mission.title}
                      </strong>

                      <p>
                        {mission.description}
                      </p>
                    </div>

                    <span>
                      {mission.done
                        ? "COMPLETADO"
                        : mission.reward}
                    </span>

                  </article>
                ))}

              </div>

            </section>

            <section className="v3-section">

              <div className="v3-section-title">

                <div>
                  <span className="v3-label">
                    RECONOCIMIENTO
                  </span>

                  <h2>
                    Tus logros
                  </h2>
                </div>

              </div>

              <div className="v3-achievements">

                {achievements.map(
                  (achievement) => (
                    <article
                      key={achievement.title}
                      className={
                        achievement.unlocked
                          ? "unlocked"
                          : "locked"
                      }
                    >
                      <div>
                        {achievement.unlocked
                          ? achievement.icon
                          : "🔒"}
                      </div>

                      <strong>
                        {achievement.title}
                      </strong>

                      <small>
                        {achievement.description}
                      </small>
                    </article>
                  )
                )}

              </div>

            </section>

          </>
        )}

        {tab === "ranking" && (
          <section className="v3-tab-content">

            <div className="v3-big-heading">
              <span className="v3-label">
                COMPETENCIA LOCAL
              </span>

              <h2>
                ¿Quién está dominando
                <br />
                San Lorenzo?
              </h2>

              <p>
                Mejorá tu perfil, conseguí más actividad
                y subí posiciones dentro del directorio.
              </p>
            </div>

            <div className="v3-ranking-board">

              <div className="v3-ranking-header">
                <span>#</span>
                <span>NEGOCIO</span>
                <span>CATEGORÍA</span>
                <span>NIVEL</span>
                <span>PUNTOS</span>
              </div>

              {[
                ["01", "Líder local", "Comercio", "97"],
                [
                  String(rankingPosition).padStart(2, "0"),
                  business?.name || "Tu negocio",
                  category,
                  String(visibilityScore),
                ],
                ["03", "Negocio destacado", "Gastronomía", "74"],
                ["04", "Comercio local", "Servicios", "68"],
                ["05", "Negocio activo", "Belleza", "61"],
                ["06", "Nuevo negocio", "Automotor", "53"],
              ].map(
                (
                  row,
                  index
                ) => (
                  <div
                    key={`${row[0]}-${row[1]}`}
                    className={
                      index === 1
                        ? "current"
                        : ""
                    }
                  >
                    <span>
                      {row[0]}
                    </span>

                    <strong>
                      {row[1]}
                    </strong>

                    <span>
                      {row[2]}
                    </span>

                    <span
                      className={
                        index === 0
                          ? "gold-text"
                          : ""
                      }
                    >
                      {index === 0
                        ? "LÍDER LOCAL"
                        : index === 1
                          ? level
                          : "ACTIVO"}
                    </span>

                    <b>
                      {row[3]}
                    </b>
                  </div>
                )
              )}

            </div>

            <div className="v3-competitive-card">

              <div>
                <span className="v3-label">
                  TU DEMO OBJETIVO
                </span>

                <h3>
                  Subí al puesto #{Math.max(
                    1,
                    rankingPosition - 1
                  )}
                </h3>

                <p>
                  Mejorando tu descripción, activando
                  WhatsApp y consiguiendo más actividad
                  podés superar al negocio que está arriba.
                </p>
              </div>

              <button
                onClick={() =>
                  setTab("growth")
                }
              >
                Ver acciones →
              </button>

            </div>

          </section>
        )}

        {tab === "growth" && (
          <section className="v3-tab-content">

            <div className="v3-big-heading">
              <span className="v3-label">
                CRECIMIENTO
              </span>

              <h2>
                Convertí tu ficha
                <br />
                en una máquina de visitas.
              </h2>

              <p>
                Estas son las acciones que más impacto
                tienen sobre tu presencia digital.
              </p>
            </div>

            <div className="v3-growth-grid">

              {[
                {
                  number: "01",
                  title: "Perfil completo",
                  description:
                    "Una ficha completa transmite más confianza.",
                  value: score,
                  action: "Completar",
                  href: business
                    ? `/dashboard/editar/${business.slug}`
                    : "/dashboard/nuevo",
                },
                {
                  number: "02",
                  title: "Mapa local",
                  description:
                    "Aparecé cuando alguien busca negocios cerca.",
                  value:
                    business?.latitude
                      ? 100
                      : 15,
                  action: "Ver mapa",
                  href: "/mapa",
                },
                {
                  number: "03",
                  title: "Contacto directo",
                  description:
                    "Facilitá que un cliente te escriba.",
                  value:
                    business?.whatsapp
                      ? 100
                      : 0,
                  action: "Activar",
                  href: business
                    ? `/dashboard/editar/${business.slug}`
                    : "/dashboard/nuevo",
                },
                {
                  number: "04",
                  title: "Visibilidad Premium",
                  description:
                    "Aparecé por encima de otros negocios.",
                  value: 100,
                  action: "Explorar",
                  href: "#premium",
                  locked: false,
                },
              ].map((item) => (
                <article
                  key={item.number}
                  className="v3-growth-item"
                >

                  <span className="v3-growth-number">
                    {item.number}
                  </span>

                  <h3>
                    {item.title}
                    {item.locked && (
                      <span>PRO</span>
                    )}
                  </h3>

                  <p>
                    {item.description}
                  </p>

                  <div className="v3-growth-bar">
                    <span
                      style={{
                        width:
                          `${item.value}%`,
                      }}
                    />
                  </div>

                  <div className="v3-growth-bottom">
                    <strong>
                      {item.value}%
                    </strong>

                    <a
                      href={item.href}
                      onClick={() => {
                        if (item.href === "#premium") {
                          setShowUpgrade(false);
                        }
                      }}
                    >
                      {item.action} →
                    </a>
                  </div>

                </article>
              ))}

            </div>

          </section>
        )}

        {tab === "marketing" && (
          <section className="v3-tab-content">

            <div className="v3-big-heading">
              <span className="v3-label">
                MARKETING
              </span>

              <h2>
                Dale algo más
                <br />
                para mostrar.
              </h2>

              <p>
                Herramientas pensadas para que los negocios
                tengan más motivos para promocionarse dentro
                de San Lorenzo Digital.
              </p>
            </div>

            <div className="v3-products-grid">

              <article>
                <div className="v3-product-icon">
                  🎟
                </div>

                <span className="v3-label">
                  PROMOCIONES
                </span>

                <h3>
                  Publicá una oferta
                </h3>

                <p>
                  Mostrá descuentos y promociones
                  para atraer clientes locales.
                </p>

                <button
                  onClick={() => {
                    setShowUpgrade(false);
                    setTab("premium");
                  }}
                >
                  Explorar
                  <span>PRO · DEMO</span>
                </button>
              </article>

              <article>
                <div className="v3-product-icon">
                  📸
                </div>

                <span className="v3-label">
                  DESTACADO
                </span>

                <h3>
                  Destacá tu negocio
                </h3>

                <p>
                  Subí tu negocio a las posiciones
                  destacadas del directorio.
                </p>

                <button
                  onClick={() => {
                    setShowUpgrade(false);
                    setTab("premium");
                  }}
                >
                  Explorar
                  <span>PRO · DEMO</span>
                </button>
              </article>

              <article>
                <div className="v3-product-icon">
                  🛍
                </div>

                <span className="v3-label">
                  PRODUCTOS
                </span>

                <h3>
                  Mostrá lo que vendés
                </h3>

                <p>
                  Agregá productos, servicios y precios
                  para convertir visitas.
                </p>

                <button
                  onClick={() => {
                    setShowUpgrade(false);
                    setTab("premium");
                  }}
                >
                  Explorar
                  <span>PRO · DEMO</span>
                </button>
              </article>

            </div>

          </section>
        )}

        {tab === "analytics" && (
          <section className="v3-tab-content">

            <div className="v3-big-heading">
              <span className="v3-label">
                ESTADÍSTICAS
              </span>

              <h2>
                Entendé cómo
                <br />
                te encuentran.
              </h2>

              <p>
                Las estadísticas avanzadas serán parte
                de los planes pagos.
              </p>
            </div>

            <div className="v3-analytics-grid">

              <article>
                <span>
                  VISITAS
                </span>
                <strong>
                  248
                </strong>
                <small>
                  +18% vs. semana anterior
                </small>
              </article>

              <article>
                <span>
                  CONTACTOS
                </span>
                <strong>
                  37
                </strong>
                <small>
                  +11 oportunidades
                </small>
              </article>

              <article>
                <span>
                  MAPA
                </span>
                <strong>
                  94
                </strong>
                <small>
                  personas te encontraron
                </small>
              </article>

              <article>
                <span>
                  PERFIL
                </span>
                <strong>
                  {score}%
                </strong>
                <small>
                  completitud
                </small>
              </article>

            </div>

            <div className="v3-chart-card">

              <div className="v3-chart-header">
                <div>
                  <span className="v3-label">
                    ACTIVIDAD
                  </span>

                  <h3>
                    Visibilidad de los últimos 7 días
                  </h3>
                </div>

                <span>
                  ÚLTIMOS 7 DÍAS
                </span>
              </div>

              <div className="v3-chart">

                {[34, 44, 39, 61, 55, 78, 92].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="v3-chart-column"
                    >
                      <span
                        style={{
                          height:
                            `${height}%`,
                        }}
                      />

                      <small>
                        {[
                          "L",
                          "M",
                          "X",
                          "J",
                          "V",
                          "S",
                          "D",
                        ][index]}
                      </small>
                    </div>
                  )
                )}

              </div>

              <div className="v3-chart-lock">
                <div>
                  🔒
                </div>

                <strong>
                  Estadísticas avanzadas
                </strong>

                <p>
                  Descubrí qué buscan tus clientes,
                  de dónde vienen y qué días tenés
                  mayor actividad.
                </p>

                <button
                  onClick={() => {
                    setShowUpgrade(false);
                    setTab("premium");
                  }}
                >
                  Ver estadísticas →
                </button>
              </div>

            </div>

          </section>
        )}

        {tab === "premium" && (
          <section
            className="v3-tab-content"
            id="premium"
          >

            <div className="v3-big-heading center">

              <span className="v3-label">
                SAN LORENZO DIGITAL PRO
              </span>

              <h2>
                Más visibilidad.
                <br />
                Más herramientas.
                <br />
                Más clientes.
              </h2>

              <p>
                El directorio es gratis. Las herramientas
                avanzadas son para los negocios que quieren
                crecer más rápido.
              </p>

            </div>

            <div className="v3-plans">

              <article className="v3-plan">

                <span>
                  GRATIS
                </span>

                <h3>
                  Presencia
                </h3>

                <strong>
                  $0
                  <small>/mes</small>
                </strong>

                <p>
                  Para cualquier negocio que quiera
                  aparecer en San Lorenzo Digital.
                </p>

                <ul>
                  <li>✓ Ficha pública</li>
                  <li>✓ Categoría</li>
                  <li>✓ Ubicación</li>
                  <li>✓ WhatsApp</li>
                  <li>✓ Ranking básico</li>
                </ul>

                <button className="current-plan">
                  Plan actual
                </button>

              </article>

              <article className="v3-plan featured-plan">

                <div className="v3-popular">
                  MÁS ELEGIDO
                </div>

                <span>
                  PRO
                </span>

                <h3>
                  Crecimiento
                </h3>

                <strong>
                  $9.900
                  <small>/mes</small>
                </strong>

                <p>
                  Para negocios que quieren más
                  visibilidad y clientes.
                </p>

                <ul>
                  <li>✓ Todo lo de Presencia</li>
                  <li>✓ Negocio destacado</li>
                  <li>✓ Promociones</li>
                  <li>✓ Productos</li>
                  <li>✓ Estadísticas</li>
                  <li>✓ Más puntos de visibilidad</li>
                </ul>

                <button
                  onClick={() => openPlan("pro")}
                >
                  PRO activo · Explorar →
                </button>

              </article>

              <article className="v3-plan">

                <span>
                  PREMIUM
                </span>

                <h3>
                  Líder
                </h3>

                <strong>
                  $19.900
                  <small>/mes</small>
                </strong>

                <p>
                  Para negocios que quieren dominar
                  su categoría.
                </p>

                <ul>
                  <li>✓ Todo lo de Pro</li>
                  <li>✓ Prioridad máxima</li>
                  <li>✓ Promociones premium</li>
                  <li>✓ Posiciones especiales</li>
                  <li>✓ Estadísticas avanzadas</li>
                  <li>✓ Herramientas exclusivas</li>
                </ul>

                <button
                  onClick={() => openPlan("premium")}
                >
                  PREMIUM activo · Explorar →
                </button>

              </article>

            </div>

          </section>
        )}

        <footer className="v3-footer">

          <div>
            <strong>
              SAN LORENZO DIGITAL
            </strong>

            <span>
              Tu ciudad. Tus negocios. Tu comunidad.
            </span>
          </div>

          <div>
            <span>
              Centro de control
            </span>

            <span>
              v3.0
            </span>
          </div>

        </footer>

      </div>

      {showUpgrade && (
        <div
          className="v3-modal-backdrop"
          onClick={() =>
            setShowUpgrade(false)
          }
        >

          <div
            className="v3-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="v3-modal-close"
              onClick={() =>
                setShowUpgrade(false)
              }
            >
              ×
            </button>

            <div className="v3-modal-icon">
              ⚡
            </div>

            <span className="v3-label">
              SAN LORENZO DIGITAL · DEMO COMERCIAL
            </span>

            <h2>
              PRO + PREMIUM
              <br />
              están desbloqueados.
            </h2>

            <p>
              Estás viendo el panel completo en modo demostración.
              Todas las herramientas comerciales están disponibles
              para probar y diseñar antes de activar los planes pagos.
            </p>

            <div className="v3-modal-features">

              <span>
                ✓ Negocio destacado
              </span>

              <span>
                ✓ Promociones
              </span>

              <span>
                ✓ Estadísticas
              </span>

              <span>
                ✓ Productos
              </span>

              <span>
                ✓ Más puntos de visibilidad
              </span>

            </div>

            <button
              className="v3-modal-button"
              onClick={() =>
                setShowUpgrade(false)
              }
            >
              Continuar explorando →
            </button>

            <small>
              La contratación online se habilitará
              cuando activemos los planes comerciales.
            </small>

          </div>

        </div>
      )}

    </main>
  );
}
