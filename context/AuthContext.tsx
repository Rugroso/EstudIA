import { User } from "@supabase/supabase-js";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { supabase } from "../lib/supabase";

// Para Apple Authentication
import * as AppleAuthentication from 'expo-apple-authentication';
// Para Google OAuth

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    confirmPassword: string,
    name: string,
    lastName: string,
    birthdate: string,
    cellphone: string,
    gender: string,
    location: string,
    profilePicture: string
  ) => Promise<void>;
  registerWithAuthProvider: (
    email: string,
    name: string,
    lastName: string,
    birthdate: string,
    cellphone: string,
    gender: string,
    location: string,
    profilePicture: string,
    uid: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  // signInWithGoogle: () => Promise<void>;
  appleSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Configuración para Google OAuth usando expo-auth-session
  // const [requestGoogle, responseGoogle, promptGoogle] = GoogleOAuth.useAuthRequest({
  //   clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  //   scopes: ['openid', 'profile', 'email'],
  // });

  // Monitor de estado de autenticación con Supabase
  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Manejo de respuesta de Google OAuth
  // useEffect(() => {
  //   if (responseGoogle?.type === "success") {
  //     const { access_token } = responseGoogle.params;
  //     signInWithGoogleToken(access_token);
  //   }
  // }, [responseGoogle]);

  // Función auxiliar para autenticación con Google token
  const signInWithGoogleToken = async (token: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token,
      });

      if (error) throw error;

      if (data.user) {
        // Verificar si el usuario ya existe en la base de datos
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 significa "no encontrado", otros errores son problemáticos
          throw fetchError;
        }

        if (existingUser) {
          router.replace("/homepage");
        } else {
          // Redirigir a registro con información de Google
          router.replace({
            pathname: "/registerAuthProvider" as any,
            params: {
              nameParam: data.user.user_metadata?.full_name?.split(' ')[0] || "",
              lastNameParam: data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "",
              emailParam: data.user.email || "",
              imageUrlParam: data.user.user_metadata?.avatar_url || "",
              uidParam: data.user.id,
            },
          });
        }
      }
    } catch (error: any) {
      Alert.alert("Error", "No se pudo iniciar sesión con Google");
      console.error("Google Sign In Error:", error);
    }
  };

  // Apple Sign In
  const appleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) throw error;

        if (data.user) {
          // Verificar si el usuario ya existe
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
          }

          if (existingUser) {
          router.replace("/homepage");
          } else {
            router.replace({
              pathname: "/registerAuthProvider" as any,
              params: {
                nameParam: credential.fullName?.givenName || "",
                lastNameParam: credential.fullName?.familyName || "",
                emailParam: credential.email || "",
                imageUrlParam: "",
                uidParam: data.user.id,
              },
            });
          }
        }
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // Usuario canceló el proceso
        return;
      }
      console.error("Apple Sign In Error:", e);
      Alert.alert("Error", "No se pudo iniciar sesión con Apple");
    }
  };

  // Google Sign In
  // const signInWithGoogle = async () => {
  //   promptGoogle();
  // };

  // Función para procesar y subir imágenes a Supabase Storage
  const processImage = async (imageUrl: string, userId: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const fileExt = imageUrl.split('.').pop() || 'jpg';
      const fileName = `${userId}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(`avatars/${fileName}`, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from('profiles')
        .getPublicUrl(`avatars/${fileName}`);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Error processing image:', error);
      return imageUrl; // Retornar URL original si falla
    }
  };

  const register = async (
    email: string,
    password: string,
    confirmPassword: string,
    name: string,
    lastName: string,
    birthdate: string,
    cellphone: string,
    gender: string,
    location: string,
    profilePicture: string
  ) => {
    if (
      !email ||
      !password ||
      !confirmPassword ||
      !name ||
      !lastName ||
      !birthdate ||
      !gender ||
      !location ||
      !cellphone
    ) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      // Registrar usuario con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        let imageUrl: string | null = null;
        if (profilePicture) {
          imageUrl = await processImage(profilePicture, authData.user.id);
        }

        // Actualizar datos del usuario en la tabla users (el trigger ya lo creó)
        const { error: dbError } = await supabase
          .from('users')
          .update({
            name,
            last_name: lastName,
            birthdate,
            gender,
            location,
            cellphone,
            profile_picture: imageUrl,
            is_admin: false,
          })
          .eq('id', authData.user.id);

        if (dbError) {
          console.error('Error updating user data:', dbError);
          // Si falla la actualización, eliminar el usuario de auth
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw new Error("Error al guardar los datos del usuario");
        }

        Alert.alert(
          "Registro exitoso", 
          "Revisa tu correo para verificar tu cuenta (igual revisa en spam o correos no deseados)."
        );
        router.replace("/" as any);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Error durante el registro");
    }
    setLoading(false);
  };

  const registerWithAuthProvider = async (
    email: string,
    name: string,
    lastName: string,
    birthdate: string,
    cellphone: string,
    gender: string,
    location: string,
    profilePicture: string,
    uid: string
  ) => {
    if (!email || !name || !lastName || !birthdate || !gender || !location || !cellphone) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }
    setLoading(true);
    try {
      const imageUrl = profilePicture ? await processImage(profilePicture, uid) : "";
      
      // Actualizar datos del usuario en la tabla users (ya existe por el trigger)
      const { error } = await supabase
        .from('users')
        .update({
          name,
          last_name: lastName,
          birthdate,
          gender,
          location,
          cellphone,
          profile_picture: imageUrl,
          is_admin: false,
        })
        .eq('id', uid);

      if (error) throw error;

      Alert.alert("Registro exitoso");
      router.replace("/homepage");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Error durante el registro");
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Verificar si el email está confirmado
        if (!data.user.email_confirmed_at) {
          Alert.alert("Error", "Debes verificar tu correo electrónico antes de iniciar sesión");
          setLoading(false);
          return;
        }

        // Obtener datos del usuario desde la tabla users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*, is_admin')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          setLoading(false);
          return;
        }

        const isAdmin = userData?.is_admin || false;
        router.replace(isAdmin ? "/homepage" as any : "/homepage" as any);
      }
    } catch (e: any) {
      if (e.message?.includes("Invalid login credentials")) {
        Alert.alert("Error", "El correo o la contraseña no son correctos");
      }
      else if (e.message?.includes("Email not confirmed")) {
        Alert.alert("Error", "Debes verificar tu correo electrónico antes de iniciar sesión");
      }
      else if (e.message?.includes("Invalid email")) {
        Alert.alert("Error", "El correo electrónico no es válido");
      }
      else if (e.message?.includes("too many requests")) {
        Alert.alert("Error", "Demasiados intentos de inicio de sesión fallidos. Intenta más tarde.");
      }
      else if (e.message?.includes("Password should be at least")) {
        Alert.alert("Error", "La contraseña es demasiado débil");
      }
      else {
        Alert.alert("Error", e.message || "Error durante el inicio de sesión");
      }
    }
    setLoading(false);
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    setUser(null);
  };



  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        registerWithAuthProvider,
        logout,
        // signInWithGoogle,
        appleSignIn
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};