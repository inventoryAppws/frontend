/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";

const AuthContext = createContext(null);


export const AuthProvider = ({ children }) => {

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );


  const [userType, setUserType] = useState(
    localStorage.getItem("userType")
  );


  const [user, setUser] = useState(() => {

    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }

  });


  // =====================================================
  // LOGIN
  // =====================================================

  const login = (
    newToken,
    type,
    userData = null
  ) => {

    localStorage.setItem(
      "token",
      newToken
    );

    localStorage.setItem(
      "userType",
      type
    );


    if (userData) {

      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );

    }


    setToken(newToken);

    setUserType(type);

    setUser(userData);

  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("user");

    setToken(null);
    setUserType(null);
    setUser(null);
  };

  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
    };
    window.addEventListener("auth:logout", handleAuthLogout);
    return () => window.removeEventListener("auth:logout", handleAuthLogout);
  }, []);


  // =====================================================
  // UPDATE USER DATA
  // =====================================================
  const updateUser = (nextData) => {
    setUser((prev) => {
      const merged = typeof nextData === "function" ? nextData(prev) : { ...prev, ...nextData };
      localStorage.setItem("user", JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userType,
        user,
        isAuthenticated: Boolean(token),
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () =>
  useContext(AuthContext);