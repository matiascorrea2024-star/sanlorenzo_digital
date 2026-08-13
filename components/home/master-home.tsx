"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  icon: string;
};

type Business = {
  id?: string;
  slug: string;
  name: string;
  category?: string;
  type?: string;
  description?: string;
  address?: string;
  rating?: number | string;
  reviews?: number;
  status?: string;
  open?: boolean;
  whatsapp?: string;
  instagram?: string;
  tags?: string[];
  accent?: string;
  schedule?: string;
  items?: Array<{
    name?: string;
    price?: string;
    note?: string;
  }>;
  promotions?: unknown;
  latitude?: number;
  longitude?: number;
  featured?: boolean;
};

const FALLBACK_CATEGORIES: Category[] = [
  { id: "calzado", name: "Calzado", icon: "👟" },
  { id: "gastronomia", name: "Gastronomía", icon: "🍽️" },
  { id: "ferreteria", name: "Ferreterías", icon: "🔧" },
  { id: "belleza", name: "Belleza", icon: "💄" },
  { id: "ropa", name: "Ropa", icon: "👕" },
  { id: "automotor", name: "Automotor", icon: "🚗" },
  { id: "profesionales", name: "Profesionales", icon: "💼" },
  { id: "tecnologia", name: "Tecnología", icon: "💻" },
];

const CATEGORY_IMAGES: Record<string, string> = {
  calzado:
    "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=900&q=85",
  gastronomia:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85",
  ferreteria:
    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=900&q=85",
  belleza:
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=85",
  ropa:
    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=85",
  automotor:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85",
  profesionales:
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85",
  tecnologia:
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85",
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2200&q=90";

function categoryFor(
  business: Business,
  categories: Category[]
) {
  return categories.find((category) => category.id === business.category);
}

function score(business: Business) {
  const rating = Number(business.rating || 0);
  const reviews = Number(business.reviews || 0);

  return rating * 10 + Math.min(reviews, 100) / 10;
}

function hasPromo(business: Business) {
  return Array.isArray(business.promotions)
    ? business.promotions.length > 0
    : Boolean(
        business.promotions &&
          typeof business.promotions === "object"
      );
}

function imageFor(business: Business) {
  return (
    CATEGORY_IMAGES[business.category || ""] ||
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85"
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function BusinessCard({
  business,
  categories,
}: {
  business: Business;
  categories: Category[];
}) {
  const category = categoryFor(business, categories);

  return (
    <Link
      href={`/negocio/${business.slug}`}
      className="v10-card"
    >
      <div
        className="v10-card-image"
        style={{
          backgroundImage: `url("${imageFor(business)}")`,
        }}
      >
        <div className="v10-card-image-overlay" />

        <div className="v10-card-top">
          {business.featured || business.status === "verificado" ? (
            <span className="v10-badge featured">
              ★ Destacado
            </span>
          ) : (
            <span className="v10-badge">
              {category?.icon || "📍"}{" "}
              {category?.name || "Local"}
            </span>
          )}

          {business.open && (
            <span className="v10-badge open">
              ● Abierto
            </span>
          )}
        </div>

        <div className="v10-card-initials">
          {initials(business.name)}
        </div>
      </div>

      <div className="v10-card-content">
        <div className="v10-card-title-row">
          <h3>{business.name}</h3>

          {business.status === "verificado" && (
            <span className="v10-check">✓</span>
          )}
        </div>

        <p className="v10-card-description">
          {business.description ||
            "Negocio local de San Lorenzo."}
        </p>

        <div className="v10-card-info">
          <span>
            ★ {Number(business.rating || 0).toFixed(1)}
          </span>

          <span>
            {Number(business.reviews || 0)} reseñas
          </span>

          {business.address && (
            <span className="v10-address">
              📍 {business.address}
            </span>
          )}
        </div>

        <div className="v10-card-footer">
          <span>
            Ver negocio
          </span>

          <span className="v10-arrow">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function MasterHome({
  businesses,
  categories,
}: {
  businesses: Business[];
  categories: Category[];
}) {
  const cats =
    categories?.length
      ? categories
      : FALLBACK_CATEGORIES;

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState("todos");

  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return businesses.filter((business) => {
      const haystack = [
        business.name,
        business.category,
        business.type,
        business.description,
        business.address,
        ...(business.tags || []),
        ...(business.items || []).map(
          (item) =>
            `${item.name || ""} ${item.note || ""}`
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        !normalized ||
        haystack.includes(normalized);

      const matchesCategory =
        activeCategory === "todos" ||
        business.category === activeCategory;

      return matchesQuery && matchesCategory;
    });
  }, [
    businesses,
    normalized,
    activeCategory,
  ]);

  const featured = [...businesses]
    .filter(
      (business) =>
        business.featured ||
        business.status === "verificado"
    )
    .sort(
      (a, b) => score(b) - score(a)
    )
    .slice(0, 4);

  const best = [...businesses]
    .sort(
      (a, b) => score(b) - score(a)
    )
    .slice(0, 6);

  const promos = businesses
    .filter(hasPromo)
    .slice(0, 6);

  const categoryCounts = cats.map(
    (category) => ({
      ...category,
      count: businesses.filter(
        (business) =>
          business.category === category.id
      ).length,
    })
  );

  return (
    <main className="v10-home">

      {/* HERO */}

      <section className="v10-hero">

        <div
          className="v10-hero-background"
          style={{
            backgroundImage: `url("${HERO_IMAGE}")`,
          }}
        />

        <div className="v10-hero-overlay" />

        <div className="v10-hero-content">

          <div className="v10-pill">
            SAN LORENZO DIGITAL
          </div>

          <h1>
            Todo San Lorenzo.
            <br />
            <strong>En un solo lugar.</strong>
          </h1>

          <p>
            Encontrá negocios, promociones,
            servicios, lugares y oportunidades
            cerca tuyo.
          </p>

          <div className="v10-search">

            <span className="v10-search-icon">
              ⌕
            </span>

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="¿Qué estás buscando?"
            />

            <button type="button">
              Buscar
            </button>

          </div>

          <div className="v10-quick">

            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategory("todos");
              }}
            >
              ✦ Explorar todo
            </button>

            <Link href="/mapa">
              📍 Ver mapa
            </Link>

            <Link href="/negocios">
              🏪 Todos los negocios
            </Link>

          </div>

        </div>

        <div className="v10-hero-stats">

          <div>
            <strong>
              {businesses.length}+
            </strong>
            <span>negocios</span>
          </div>

          <div>
            <strong>
              {cats.length}
            </strong>
            <span>categorías</span>
          </div>

          <div>
            <strong>
              24/7
            </strong>
            <span>para explorar</span>
          </div>

        </div>

      </section>

      {/* CATEGORÍAS */}

      <section className="v10-section">

        <div className="v10-section-heading">

          <div>
            <span>EXPLORÁ</span>
            <h2>
              ¿Qué estás buscando?
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveCategory("todos")
            }
          >
            Ver todo →
          </button>

        </div>

        <div className="v10-category-grid">

          {categoryCounts
            .slice(0, 8)
            .map((category) => (
              <button
                key={category.id}
                type="button"
                className={
                  activeCategory === category.id
                    ? "v10-category active"
                    : "v10-category"
                }
                onClick={() =>
                  setActiveCategory(
                    category.id
                  )
                }
              >

                <div
                  className="v10-category-image"
                  style={{
                    backgroundImage: `url("${CATEGORY_IMAGES[category.id] || HERO_IMAGE}")`,
                  }}
                />

                <div className="v10-category-content">
                  <span className="v10-category-icon">
                    {category.icon}
                  </span>

                  <strong>
                    {category.name}
                  </strong>

                  <small>
                    {category.count} negocios
                  </small>
                </div>

              </button>
            ))}

        </div>

      </section>

      {/* RESULTADOS DE BÚSQUEDA */}

      {(normalized ||
        activeCategory !== "todos") && (
        <section className="v10-section v10-results">

          <div className="v10-section-heading">
            <div>
              <span>RESULTADOS</span>
              <h2>
                Encontramos {filtered.length}
              </h2>
            </div>
          </div>

          {filtered.length ? (
            <div className="v10-card-grid">
              {filtered.map((business) => (
                <BusinessCard
                  key={business.slug}
                  business={business}
                  categories={cats}
                />
              ))}
            </div>
          ) : (
            <div className="v10-empty">
              No encontramos negocios con esa búsqueda.
            </div>
          )}

        </section>
      )}

      {/* DESTACADOS */}

      {!normalized &&
        activeCategory === "todos" &&
        featured.length > 0 && (
          <section className="v10-section">

            <div className="v10-section-heading">

              <div>
                <span>NEGOCIOS DESTACADOS</span>
                <h2>
                  Los protagonistas de la ciudad
                </h2>
              </div>

              <Link href="/negocios">
                Ver todos →
              </Link>

            </div>

            <div className="v10-card-grid">

              {featured.map((business) => (
                <BusinessCard
                  key={business.slug}
                  business={business}
                  categories={cats}
                />
              ))}

            </div>

          </section>
        )}

      {/* PROMOCIONES */}

      {!normalized &&
        activeCategory === "todos" &&
        promos.length > 0 && (
          <section className="v10-section v10-promo-section">

            <div className="v10-promo-heading">
              <div>
                <span>HOY EN SAN LORENZO</span>
                <h2>
                  Ofertas y promociones
                </h2>
                <p>
                  Descubrí oportunidades de negocios
                  locales antes que nadie.
                </p>
              </div>

              <span className="v10-promo-label">
                🔥 AHORA
              </span>
            </div>

            <div className="v10-card-grid">

              {promos.map((business) => (
                <BusinessCard
                  key={business.slug}
                  business={business}
                  categories={cats}
                />
              ))}

            </div>

          </section>
        )}

      {/* MEJOR VALORADOS */}

      {!normalized &&
        activeCategory === "todos" && (
          <section className="v10-section">

            <div className="v10-section-heading">

              <div>
                <span>COMUNIDAD</span>
                <h2>
                  Los mejor valorados
                </h2>
              </div>

              <Link href="/negocios">
                Explorar →
              </Link>

            </div>

            <div className="v10-card-grid">

              {best.map((business) => (
                <BusinessCard
                  key={business.slug}
                  business={business}
                  categories={cats}
                />
              ))}

            </div>

          </section>
        )}

      {/* MAPA */}

      <section className="v10-map-cta">

        <div>

          <span>
            📍 TODO CERCA TUYO
          </span>

          <h2>
            San Lorenzo,
            <br />
            vista desde el mapa.
          </h2>

          <p>
            Explorá negocios alrededor tuyo,
            encontrá nuevos lugares y descubrí
            qué hay cerca.
          </p>

          <Link href="/mapa">
            Abrir mapa →
          </Link>

        </div>

        <div className="v10-map-preview">

          <div className="v10-map-grid" />

          <span className="v10-map-pin pin1">
            📍
          </span>

          <span className="v10-map-pin pin2">
            📍
          </span>

          <span className="v10-map-pin pin3">
            📍
          </span>

          <span className="v10-map-pin pin4">
            📍
          </span>

          <div className="v10-map-label">
            SAN LORENZO
          </div>

        </div>

      </section>

      {/* NEGOCIOS */}

      <section className="v10-business-cta">

        <div>

          <span>
            PARA NEGOCIOS
          </span>

          <h2>
            ¿Tenés un negocio
            <br />
            en San Lorenzo?
          </h2>

          <p>
            Creá tu presencia digital,
            mostrá tus productos, promociones,
            ubicación y recibí clientes.
          </p>

        </div>

        <Link href="/sumate">
          Sumá tu negocio →
        </Link>

      </section>

      {/* FOOTER */}

      <footer className="v10-footer">

        <div>
          <strong>
            SAN LORENZO
            <span> DIGITAL</span>
          </strong>

          <p>
            La ciudad, conectada.
          </p>
        </div>

        <div className="v10-footer-links">

          <Link href="/">
            Inicio
          </Link>

          <Link href="/negocios">
            Negocios
          </Link>

          <Link href="/mapa">
            Mapa
          </Link>

          <Link href="/para-negocios">
            Para negocios
          </Link>

        </div>

      </footer>

    </main>
  );
}
