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
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
          {/* Header con gradiente */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={["#6366F1", "#8B5CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <MaterialIcons name="person-add" size={48} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Completa tus datos para unirte a EstudIA</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>

            {/* Nombre y Apellido en fila */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Nombre</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="person" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Tu nombre"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Apellido</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.inputNoPadding]}
                    placeholder="Tu apellido"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="email" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Teléfono y Fecha de nacimiento en fila */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Teléfono</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="phone" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="+52 123 456"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={cellphone}
                    onChangeText={setCellphone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Nacimiento</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="cake" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={birthdate}
                    onChangeText={setBirthdate}
                  />
                </View>
              </View>
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
                  activeOpacity={0.7}
                >
                  <MaterialIcons 
                    name="male" 
                    size={20} 
                    color={gender === "Masculino" ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)"} 
                  />
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
                  activeOpacity={0.7}
                >
                  <MaterialIcons 
                    name="female" 
                    size={20} 
                    color={gender === "Femenino" ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)"} 
                  />
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
                  activeOpacity={0.7}
                >
                  <MaterialIcons 
                    name="wc" 
                    size={20} 
                    color={gender === "Otro" ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)"} 
                  />
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
              <View style={styles.inputWrapper}>
                <MaterialIcons name="location-on" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ciudad, País"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={location}
                  onChangeText={setLocation}
                  autoCapitalize="words"
                />
              </View>
            </View>


            {/* Contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color="rgba(255, 255, 255, 0.4)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirmar contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialIcons
                    name={showConfirmPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color="rgba(255, 255, 255, 0.4)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón de registro con gradiente */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ["#4B5563", "#6B7280"] : ["#6366F1", "#8B5CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Crear cuenta</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
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
    backgroundColor: "#0A0A0F",
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
  logoContainer: {
    marginBottom: 24,
    borderRadius: 28,
    overflow: "hidden",
  },
  logoGradient: {
    width: 96,
    height: 96,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 22,
  },
  form: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
    marginTop: 8,
    letterSpacing: -0.3,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#FFFFFF",
  },
  inputNoPadding: {
    paddingLeft: 0,
  },
  inputWithIcon: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  genderContainer: {
    flexDirection: "row",
    gap: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  genderButtonActive: {
    backgroundColor: "rgba(99, 102, 241, 0.3)",
    borderColor: "#6366F1",
  },
  genderButtonText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  genderButtonTextActive: {
    color: "#FFFFFF",
  },
  primaryButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 15,
  },
  linkText: {
    color: "#6366F1",
    fontSize: 15,
    fontWeight: "700",
  },
});
