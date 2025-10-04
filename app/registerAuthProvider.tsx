import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
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

export default function RegisterAuthProvider() {
  const params = useLocalSearchParams<{
    nameParam?: string;
    lastNameParam?: string;
    emailParam?: string;
    imageUrlParam?: string;
    uidParam?: string;
  }>();

  const [name, setName] = useState(params.nameParam || "");
  const [lastName, setLastName] = useState(params.lastNameParam || "");
  const [email] = useState(params.emailParam || "");
  const [birthdate, setBirthdate] = useState("");
  const [cellphone, setCellphone] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  
  const { registerWithAuthProvider, loading } = useAuth();

  const handleRegister = async () => {
    if (!name || !lastName || !birthdate || !cellphone || !gender || !location) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    await registerWithAuthProvider(
      email,
      name,
      lastName,
      birthdate,
      cellphone,
      gender,
      location,
      params.imageUrlParam || "",
      params.uidParam || ""
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
            {params.imageUrlParam && (
              <Image
                source={{ uri: params.imageUrlParam }}
                style={styles.profileImage}
              />
            )}
            <Text style={styles.title}>Completa tu Perfil</Text>
            <Text style={styles.subtitle}>
              Necesitamos algunos datos adicionales
            </Text>
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

            {/* Email (solo lectura) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={email}
                editable={false}
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

            {/* Botón de completar registro */}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Completar registro</Text>
              )}
            </TouchableOpacity>
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
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
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
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: Colors.dark.background,
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
});
