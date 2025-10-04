import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [cellphone, setCellphone] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  
  const { register, loading } = useAuth();

  const handleRegister = async () => {
    // Validaciones básicas
    if (!email || !password || !confirmPassword || !name || !lastName || 
        !birthdate || !cellphone || !gender || !location) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    await register(
      email,
      password,
      confirmPassword,
      name,
      lastName,
      birthdate,
      cellphone,
      gender,
      location,
      "" // profilePicture vacío por ahora
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Completa tus datos para registrarte</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Nombre */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                placeholderTextColor={Colors.dark.tabIconDefault}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Apellido */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Apellido</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu apellido"
                placeholderTextColor={Colors.dark.tabIconDefault}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={Colors.dark.tabIconDefault}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            {/* Teléfono */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="+52 123 456 7890"
                placeholderTextColor={Colors.dark.tabIconDefault}
                value={cellphone}
                onChangeText={setCellphone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Fecha de nacimiento */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Fecha de nacimiento</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={Colors.dark.tabIconDefault}
                value={birthdate}
                onChangeText={setBirthdate}
              />
            </View>

            {/* Género */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Género</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === "Masculino" && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender("Masculino")}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === "Masculino" && styles.genderButtonTextActive,
                    ]}
                  >
                    Masculino
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === "Femenino" && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender("Femenino")}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === "Femenino" && styles.genderButtonTextActive,
                    ]}
                  >
                    Femenino
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === "Otro" && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender("Otro")}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === "Otro" && styles.genderButtonTextActive,
                    ]}
                  >
                    Otro
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Ubicación */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Ubicación</Text>
              <TextInput
                style={styles.input}
                placeholder="Ciudad, País"
                placeholderTextColor={Colors.dark.tabIconDefault}
                value={location}
                onChangeText={setLocation}
                autoCapitalize="words"
              />
            </View>

            {/* Contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={Colors.dark.tabIconDefault}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Confirmar contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Repite tu contraseña"
                placeholderTextColor={Colors.dark.tabIconDefault}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Botón de registro */}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Crear cuenta</Text>
              )}
            </TouchableOpacity>

            {/* Link a login */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.linkText}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.tabIconDefault,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.tabIconDefault,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.tabIconDefault,
    alignItems: "center",
  },
  genderButtonActive: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  genderButtonText: {
    color: Colors.dark.tabIconDefault,
    fontSize: 14,
    fontWeight: "600",
  },
  genderButtonTextActive: {
    color: "#fff",
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: Colors.dark.tint,
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  footerText: {
    color: Colors.dark.tabIconDefault,
    fontSize: 14,
  },
  linkText: {
    color: Colors.dark.tint,
    fontSize: 14,
    fontWeight: "600",
  },
});
