"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Flower2,
  Sparkles,
  ArrowRight,
  Check,
  Compass,
  Eye,
  X,
  Music,
  Smartphone,
  Layers,
  MapPin,
  Calendar,
  Heart,
} from "lucide-react";
import {
  CATALOG_CATEGORIES,
  THEME_CATALOG,
  type CatalogTheme,
} from "@/templates/catalog";
import "./catalog.css";

export default function InvitationCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeModalTheme, setActiveModalTheme] = useState<CatalogTheme | null>(
    null
  );

  const filteredThemes =
    selectedCategory === "all"
      ? THEME_CATALOG
      : THEME_CATALOG.filter((theme) => theme.category === selectedCategory);

  return (
    <div className="catalog-page">
      {/* Background ambient lighting glows */}
      <div className="catalog-glow catalog-glow-1" />
      <div className="catalog-glow catalog-glow-2" />

      {/* Top Navigation */}
      <header className="catalog-nav">
        <div className="catalog-nav-inner">
          <Link href="/" className="catalog-brand" aria-label="Protēa Home">
            <div className="brand-icon-wrapper">
              <Flower2 size={22} strokeWidth={1.4} />
            </div>
            <span className="brand-text">protēa</span>
            <span className="brand-badge">Undangan Spasial</span>
          </Link>

          <nav className="catalog-nav-actions" aria-label="Menu Utama">
            <a href="#katalog" className="nav-link">
              Katalog Tema
            </a>
            <a href="#keunggulan" className="nav-link">
              Keunggulan
            </a>
            <a href="#katalog" className="nav-cta-btn">
              Pilih Undangan <ArrowRight size={14} />
            </a>
          </nav>
        </div>
      </header>


      {/* Category Filter Bar */}
      <section
        id="katalog"
        className="catalog-filter-section"
        aria-label="Filter Kategori Tema"
      >
        <div className="category-tabs" role="tablist">
          {CATALOG_CATEGORIES.map((category) => (
            <button
              key={category.id}
              role="tab"
              aria-selected={selectedCategory === category.id}
              className={`category-tab-btn ${
                selectedCategory === category.id ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </section>

      {/* Invitation Cards Grid */}
      <section
        className="catalog-grid-section"
        aria-label="Daftar Undangan Pernikahan"
      >
        <div className="themes-grid">
          {filteredThemes.map((theme) => (
            <article key={theme.id} className="theme-card">
              {/* Card Media Preview */}
              <div className="card-media">
                <img
                  src={theme.previewImage}
                  alt={`Pratinjau tema ${theme.name}`}
                  className="card-media-img"
                  loading="lazy"
                />
                <div className="card-media-overlay" />
                <span className="card-badge">{theme.badge}</span>
                <div className="card-media-footer">
                  <div>
                    <div className="card-couple">{theme.couple}</div>
                    <div className="card-date">
                      <Calendar
                        size={11}
                        style={{ display: "inline", marginRight: 4 }}
                      />
                      {theme.weddingDate}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      opacity: 0.85,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <MapPin size={11} />
                    {theme.location.split(",")[0]}
                  </span>
                </div>
              </div>

              {/* Card Content Body */}
              <div className="card-content">
                <div className="card-header-row">
                  <h2 className="card-title">{theme.name}</h2>
                  <div className="card-palette" title="Palet Warna Tema">
                    {theme.palette.map((color, idx) => (
                      <span
                        key={idx}
                        className="palette-swatch"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="card-subtitle">{theme.subtitle}</div>
                <p className="card-desc">{theme.description}</p>

                {/* Feature Pills */}
                <div className="card-features">
                  {theme.features.map((feature, idx) => (
                    <span key={idx} className="feature-pill">
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Card CTA Actions */}
                <div className="card-actions">
                  <Link
                    href={theme.route}
                    className="btn-open-invitation"
                    id={`open-theme-${theme.id}`}
                  >
                    Buka Undangan <ArrowRight size={15} />
                  </Link>
                  <button
                    className="btn-details"
                    onClick={() => setActiveModalTheme(theme)}
                    aria-label={`Lihat detail dan cuplikan ${theme.name}`}
                  >
                    <Eye size={15} style={{ marginRight: 6 }} /> Detail
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Value Propositions / Why Protea */}
      <section
        id="keunggulan"
        className="catalog-values-section"
        aria-labelledby="values-title"
      >
        <div className="values-inner">
          <div className="values-heading">
            <h2 id="values-title" className="values-title">
              Sentuhan Sinematik untuk Hari Istimewa
            </h2>
            <p className="values-subtitle">
              Setiap undangan dirancang khusus dengan teknologi 3D modern untuk
              memberikan kesan mendalam yang tak terlupakan bagi setiap tamu.
            </p>
          </div>

          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">
                <Layers size={22} />
              </div>
              <h3 className="value-name">Alur Cerita Spasial</h3>
              <p className="value-text">
                Bukan sekadar menggulir teks biasa. Pengalaman berlapis 2.5D dan
                3D membawa tamu merasakan atmosfer dan perjalanan cinta Anda.
              </p>
            </div>

            <div className="value-card">
              <div className="value-icon">
                <Music size={22} />
              </div>
              <h3 className="value-name">Audio & Suasana Khidmat</h3>
              <p className="value-text">
                Disertai iringan musik pilihan yang mengalun lembut, menciptakan
                harmoni emosional sejak pertama kali undangan dibuka.
              </p>
            </div>

            <div className="value-card">
              <div className="value-icon">
                <Smartphone size={22} />
              </div>
              <h3 className="value-name">Sempurna di Semua Layar</h3>
              <p className="value-text">
                Dioptimalkan untuk smartphone layar vertikal (portrait), tablet,
                hingga laptop desktop tanpa mengurangi keindahan grafis.
              </p>
            </div>

            <div className="value-card">
              <div className="value-icon">
                <Heart size={22} />
              </div>
              <h3 className="value-name">RSVP & Konfirmasi Praktis</h3>
              <p className="value-text">
                Tamu dapat langsung mengonfirmasi kehadiran serta melihat rute
                menuju lokasi acara secara terintegrasi dan akurat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="catalog-footer">
        <div className="footer-top">
          <div className="catalog-brand">
            <div className="brand-icon-wrapper">
              <Flower2 size={20} strokeWidth={1.4} />
            </div>
            <span className="brand-text">protēa</span>
          </div>
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>
            A little world. A lasting love.
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 Protēa Invitations. Seluruh hak cipta dilindungi.</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", cursor: "pointer" }}
          >
            Kembali ke Atas <ArrowRight size={13} style={{ transform: "rotate(-90deg)" }} />
          </button>
        </div>
      </footer>

      {/* Theme Detail Modal */}
      {activeModalTheme && (
        <div
          className="detail-modal-backdrop"
          onClick={() => setActiveModalTheme(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-theme-title"
        >
          <div
            className="detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Banner */}
            <div className="modal-header-banner">
              <img
                src={activeModalTheme.previewImage}
                alt={activeModalTheme.name}
              />
              <div className="modal-banner-overlay" />
              <button
                className="modal-close-btn"
                onClick={() => setActiveModalTheme(null)}
                aria-label="Tutup detail"
              >
                <X size={18} />
              </button>
              <div className="modal-banner-content">
                <span className="card-badge" style={{ position: "static", display: "inline-block", marginBottom: 8 }}>
                  {activeModalTheme.badge}
                </span>
                <h2
                  id="modal-theme-title"
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: "30px",
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  {activeModalTheme.name}
                </h2>
                <div style={{ fontSize: "12px", opacity: 0.9, marginTop: 4 }}>
                  {activeModalTheme.couple} • {activeModalTheme.weddingDate}
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              <p className="modal-desc">{activeModalTheme.description}</p>

              {/* Specs Grid */}
              <div className="modal-section-label">Spesifikasi Pengalaman</div>
              <div className="modal-spec-grid">
                {activeModalTheme.highlights.map((item, idx) => (
                  <div key={idx} className="spec-item">
                    <span className="spec-label">{item.label}</span>
                    <span className="spec-val">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Features List */}
              <div className="modal-section-label">Fitur & Interaksi</div>
              <div className="modal-features-list">
                {activeModalTheme.features.map((feature, idx) => (
                  <div key={idx} className="modal-feature-item">
                    <Check size={16} color="var(--olive)" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Modal CTA */}
              <div className="modal-actions">
                <button
                  className="btn-details"
                  onClick={() => setActiveModalTheme(null)}
                >
                  Tutup
                </button>
                <Link
                  href={activeModalTheme.route}
                  className="btn-open-invitation"
                >
                  Buka Undangan Langsung <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
