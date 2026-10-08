import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import {
  ArrowUpRight,
  Menu,
  Search,
  X,
  User,
} from "lucide-react";

import { categories } from "../data/categories.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState("");

  const navigate = useNavigate();

  const { user, profile, signOut } = useAuth();

  /* =========================================================
     SEARCH
  ========================================================= */

  const submitSearch = (event) => {
    event.preventDefault();

    const term = query.trim();

    if (term) {
      navigate(`/shop?search=${encodeURIComponent(term)}`);
      setSearchOpen(false);
    }
  };

  /* =========================================================
     MENU
  ========================================================= */

  const closeMenu = () => {
    setMenuOpen(false);
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    await signOut();

    setAccountOpen(false);
    setMenuOpen(false);

    navigate("/");
  };

  /* =========================================================
     DASHBOARD PATH
  ========================================================= */

  const getDashboardPath = () => {
    if (!profile) return "/";

    if (profile.role === "admin") {
      return "/admin";
    }

    if (profile.role === "seller") {
      return "/seller";
    }

    return "/customer";
  };

  /* =========================================================
     PROFILE PATH
  ========================================================= */

  const getProfilePath = () => {
    if (!profile) return "/";

    if (profile.role === "admin") {
      return "/admin/profile";
    }

    if (profile.role === "seller") {
      return "/seller/profile";
    }

    return "/customer/profile";
  };

  return (
    <>
      {/* =====================================================
          TOP ANNOUNCEMENT
      ===================================================== */}

      <div
        className="bg-[#171717] px-4 py-[9px] text-center text-[10px] font-medium tracking-[.11em] text-[#f7f6f2] sm:text-[11px]"
        data-testid="text-store-note"
      >
        A considered place for everyday things

        <span className="mx-2 text-white/40">
          ·
        </span>

        Good things, chosen well
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="relative z-30 border-b border-black/10 bg-[#f7f6f2]">
        <div className="page-shell flex h-[76px] items-center justify-between gap-5 md:h-[88px]">

          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <div className="flex flex-1 items-center gap-9">

            {/* Mobile Menu */}

            <button
              className="grid h-10 w-10 place-items-center md:hidden"
              aria-label={
                menuOpen ? "Close menu" : "Open menu"
              }
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X
                  size={21}
                  strokeWidth={1.7}
                />
              ) : (
                <Menu
                  size={21}
                  strokeWidth={1.7}
                />
              )}
            </button>

            {/* Desktop Categories */}

            <nav
              className="hidden items-center gap-6 md:flex"
              aria-label="Shop categories"
            >
              {categories.slice(0, 3).map((category) => (
                <NavLink
                  key={category.slug}
                  to={`/shop/${category.slug}`}
                  className={({ isActive }) =>
                    `text-[12px] transition-colors hover:text-black/55 ${
                      isActive
                        ? "font-semibold"
                        : "font-medium"
                    }`
                  }
                >
                  {category.name}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* =================================================
              LOGO
          ================================================= */}

          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 text-[23px] font-extrabold tracking-[-.095em] md:text-[26px]"
            aria-label="E-SHOP home"
          >
            E-SHOP

            <span className="ml-[2px] text-[8px] align-top tracking-normal">
              ®
            </span>
          </Link>

          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <div className="flex flex-1 items-center justify-end gap-4">

            {/* More Categories */}

            <nav
              className="hidden items-center gap-6 lg:flex"
              aria-label="More categories"
            >
              {categories.slice(3).map((category) => (
                <NavLink
                  key={category.slug}
                  to={`/shop/${category.slug}`}
                  className={({ isActive }) =>
                    `text-[12px] transition-colors hover:text-black/55 ${
                      isActive
                        ? "font-semibold"
                        : "font-medium"
                    }`
                  }
                >
                  {category.name}
                </NavLink>
              ))}
            </nav>

            {/* Search */}

            <button
              className="flex h-10 items-center gap-2 text-[12px] font-medium"
              aria-label="Open search"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search
                size={17}
                strokeWidth={1.7}
              />

              <span className="hidden sm:inline">
                Search
              </span>
            </button>

            {/* Shop All */}

            <Link
              to="/shop"
              className="hidden items-center gap-1 border-b border-black pb-1 text-[11px] font-semibold sm:flex"
            >
              Shop all

              <ArrowUpRight size={13} />
            </Link>

            {/* =================================================
                ACCOUNT
            ================================================= */}

            {user ? (
              <div className="relative">

                <button
                  onClick={() =>
                    setAccountOpen(!accountOpen)
                  }
                  className="flex items-center gap-2 text-[12px] font-medium"
                  aria-label="Open account menu"
                  aria-expanded={accountOpen}
                >
                  <User
                    size={17}
                    strokeWidth={1.7}
                  />

                  <span className="hidden sm:inline">
                    {profile?.full_name
                      ? profile.full_name.split(" ")[0]
                      : "Account"}
                  </span>
                </button>

                {/* =================================================
                    ACCOUNT DROPDOWN
                ================================================= */}

                {accountOpen && (
                  <div className="absolute right-0 top-12 z-50 w-52 border border-black/10 bg-[#f7f6f2] p-2 shadow-xl">

                    {/* User Info */}

                    <div className="border-b border-black/10 px-3 py-3">
                      <p className="text-sm font-semibold">
                        {profile?.full_name || "User"}
                      </p>

                      <p className="mt-1 truncate text-[11px] text-black/50">
                        {user.email}
                      </p>

                      <p className="mt-2 text-[10px] uppercase tracking-wider text-black/40">
                        {profile?.role || "customer"}
                      </p>
                    </div>

                    {/* =================================================
                        MY PROFILE
                    ================================================= */}

                    <Link
                      to={getProfilePath()}
                      onClick={() =>
                        setAccountOpen(false)
                      }
                      className="block px-3 py-3 text-[12px] hover:bg-black/5"
                    >
                      My Profile
                    </Link>

                    {/* =================================================
                        DASHBOARD
                    ================================================= */}

                    <Link
                      to={getDashboardPath()}
                      onClick={() =>
                        setAccountOpen(false)
                      }
                      className="block border-t border-black/10 px-3 py-3 text-[12px] hover:bg-black/5"
                    >
                      Dashboard
                    </Link>

                    {/* =================================================
                        LOGOUT
                    ================================================= */}

                    <button
                      onClick={handleLogout}
                      className="w-full border-t border-black/10 px-3 py-3 text-left text-[12px] hover:bg-black/5"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (

              /* =================================================
                 LOGIN / REGISTER
              ================================================= */

              <div className="flex items-center gap-3">

                <Link
                  to="/login"
                  className="text-[12px] font-medium hover:text-black/55"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="hidden border-b border-black pb-1 text-[11px] font-semibold sm:block"
                >
                  Register
                </Link>

              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            SEARCH PANEL
        ===================================================== */}

        {searchOpen && (
          <div
            className="border-t border-black/10 bg-[#f7f6f2]"
            data-testid="panel-search"
          >
            <form
              className="page-shell flex items-center gap-4 py-5"
              onSubmit={submitSearch}
            >
              <Search
                size={20}
                strokeWidth={1.5}
                className="shrink-0"
              />

              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="What are you looking for?"
                className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-black/40"
                aria-label="Search the shop"
              />

              <button
                type="submit"
                className="text-[11px] font-bold uppercase tracking-[.12em]"
              >
                Search
              </button>

              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="p-2"
              >
                <X size={18} />
              </button>
            </form>
          </div>
        )}

        {/* =====================================================
            MOBILE MENU
        ===================================================== */}

        {menuOpen && (
          <nav
            className="absolute inset-x-0 top-full border-b border-black/10 bg-[#f7f6f2] px-[18px] pb-5 pt-2 shadow-lg md:hidden"
            aria-label="Mobile menu"
          >

            {categories.map((category, index) => (
              <Link
                key={category.slug}
                to={`/shop/${category.slug}`}
                onClick={closeMenu}
                className="flex items-center justify-between border-b border-black/10 py-4 text-[17px] font-medium"
              >
                <span>
                  {category.name}
                </span>

                <span className="text-[10px] text-black/40">
                  0{index + 1}
                </span>
              </Link>
            ))}

            <Link
              to="/shop"
              onClick={closeMenu}
              className="mt-4 flex items-center justify-between py-3 text-[12px] font-semibold"
            >
              Explore all

              <ArrowUpRight size={15} />
            </Link>

            {/* =================================================
                MOBILE AUTHENTICATION
            ================================================= */}

            <div className="mt-3 border-t border-black/10 pt-3">

              {user ? (
                <>

                  {/* Mobile My Profile */}

                  <Link
                    to={getProfilePath()}
                    onClick={closeMenu}
                    className="block py-3 text-[14px] font-medium"
                  >
                    My Profile
                  </Link>

                  {/* Mobile Dashboard */}

                  <Link
                    to={getDashboardPath()}
                    onClick={closeMenu}
                    className="block py-3 text-[14px] font-medium"
                  >
                    Dashboard
                  </Link>

                  {/* Mobile Logout */}

                  <button
                    onClick={handleLogout}
                    className="block py-3 text-[14px] font-medium"
                  >
                    Logout
                  </button>

                </>
              ) : (
                <>

                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="block py-3 text-[14px] font-medium"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="block py-3 text-[14px] font-medium"
                  >
                    Create Account
                  </Link>

                </>
              )}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}