import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  const loadProfile = async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (error) {
      console.error("Profile loading error:", error);
      setProfile(null);
      return null;
    }

    // ==========================================================
    // BLOCKED ACCOUNT
    // ==========================================================

    if (data.status === "blocked") {
      console.warn("Blocked account attempted access.");

      await supabase.auth.signOut();

      setUser(null);
      setProfile(null);

      return null;
    }

    setProfile(data);

    return data;
  };

  // ============================================================
  // INITIAL AUTH
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        const currentUser = session?.user ?? null;

        if (!currentUser) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        const loadedProfile =
          await loadProfile(currentUser);

        if (!mounted) return;

        if (loadedProfile) {
          setUser(currentUser);
        } else {
          setUser(null);
          setProfile(null);
        }

        setLoading(false);
      } catch (error) {
        console.error(
          "Auth initialization error:",
          error
        );

        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // ==========================================================
    // AUTH STATE CHANGE
    // ==========================================================

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        const currentUser =
          session?.user ?? null;

        if (!currentUser) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        const loadedProfile =
          await loadProfile(currentUser);

        if (!mounted) return;

        if (loadedProfile) {
          setUser(currentUser);
        } else {
          setUser(null);
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================
  // SIGN UP
  // ============================================================

  const signUp = async ({
    email,
    password,
    fullName,
    role,
  }) => {
    if (!["customer", "seller"].includes(role)) {
      return {
        error: new Error(
          "Invalid registration role"
        ),
      };
    }

    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });
  };

  // ============================================================
  // SIGN IN
  // ============================================================

  const signIn = async ({ email, password }) => {
    const result =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (result.error) {
      return result;
    }

    const signedInUser = result.data?.user;

    if (!signedInUser) {
      return {
        data: result.data,
        error: new Error(
          "Unable to retrieve user account."
        ),
      };
    }

    // Check profile/status immediately
    const loadedProfile =
      await loadProfile(signedInUser);

    if (!loadedProfile) {
      return {
        data: null,
        error: new Error(
          "Your account has been blocked or your profile could not be loaded."
        ),
      };
    }

    setUser(signedInUser);
    setProfile(loadedProfile);

    return {
      ...result,
      error: null,
    };
  };

  // ============================================================
  // SIGN OUT
  // ============================================================

  const signOut = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (!error) {
      setUser(null);
      setProfile(null);
    }

    return { error };
  };

  // ============================================================
  // RESET PASSWORD
  // ============================================================

  const resetPassword = async (email) => {
    return await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          `${window.location.origin}/reset-password`,
      }
    );
  };

  // ============================================================
  // CONTEXT
  // ============================================================

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}