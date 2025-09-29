import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import alert from "@/components/Alert";

interface ConsultaItem {
  identificacion: string;
  nombreComercial: string;
  clase: string;
  tipoIdentificacion: string;
}

interface DataItemProps {
  icon: string;
  label: string;
  value: string | number | undefined;
}

const DataItem = ({ icon, label, value }: DataItemProps) => (
  <View style={styles.dataItem} accessible accessibilityLabel={label}>
    <View style={styles.iconContainer}>
      <FontAwesome5 name={icon} size={18} color="#1976D2" />
    </View>
    <View style={styles.dataTextContainer}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value?.toString().trim() || "N/A"}</Text>
    </View>
  </View>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View>{children}</View>
  </View>
);

const { height, width } = Dimensions.get("window");

// Función para formatear fechas mm/dd/yyyy a dd/mm/yyyy
function formatDate(dateStr?: string) {
  if (!dateStr) return dateStr;
  // Verifica si la fecha tiene el formato mm/dd/yyyy
  const regex = /^([0-1]?\d)\/([0-3]?\d)\/(\d{4})$/;
  const match = regex.exec(dateStr);
  if (match) {
    const [, mm, dd, yyyy] = match;
    return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
  }
  return dateStr;
}

export default function CitizenSearch() {
  const [input, setInput] = useState("");
  const [isValidInput, setIsValidInput] = useState(false);
  const [inputError, setInputError] = useState("");
  const [lista, setLista] = useState<ConsultaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [data, setData] = useState<any>(null);

  function isValidCI(ci: string) {
    if (isNaN(Number(ci)) || ci.length !== 10) return false;
    let total = 0;
    let isNumeric = true;
    const digits = ci.split("");
    for (let i = 0; i < 9; i++) {
      const digit = Number.parseInt(digits[i], 10);
      if (Number.isNaN(digit)) {
        isNumeric = false;
        break;
      }
      if (i % 2 === 0) {
        const doubled = digit * 2;
        total += doubled > 9 ? 1 + (doubled % 10) : doubled;
      } else {
        total += digit;
      }
    }
    if (!isNumeric) return false;
    total = (10 - (total % 10)) % 10;
    return total === Number.parseInt(digits[9], 10);
  }

  const handleInputChange = (text: string) => {
    setInput(text);
    if (text.length === 0) {
      setInputError("");
      setIsValidInput(false);
      return;
    }
    const firstChar = text.charAt(0);
    if (!isNaN(Number(firstChar))) {
      if (!/^\d+$/.test(text)) {
        setInputError("Solo números permitidos.");
        setIsValidInput(false);
        return;
      }
      if (text.length <= 10) {
        if (isValidCI(text)) {
          setInputError("");
          setIsValidInput(true);
        } else {
          setInputError("Cédula no válida.");
          setIsValidInput(false);
        }
      } else {
        setInputError("Máximo 10 dígitos.");
        setIsValidInput(false);
      }
    } else if (/^[a-zA-Z]/.test(firstChar)) {
      if (!/^[a-zA-Z\u00f1\u00d1 ]+$/.test(text)) {
        setInputError("Solo letras y espacios permitidos.");
        setIsValidInput(false);
        return;
      }
      const words = text.trim().split(" ");
      if (words.length < 2) {
        setInputError("Debe ingresar al menos dos nombres.");
        setIsValidInput(false);
      } else {
        setInputError("");
        setIsValidInput(true);
      }
    } else {
      setInputError("Entrada no válida.");
      setIsValidInput(false);
    }
  };

  const handleConsulta = async (cedula?: string) => {
    if (!isValidInput || input.trim() === "") {
      alert("Error", "Ingrese un valor válido.", [
        { style: "default", onPress: () => {} },
      ]);
      return;
    }
    setLoading(true);
    const url = "https://api.lxndr.dev/util/datosCiudadano";
    const usar = typeof cedula === "string" ? cedula : input;
    const tipo = isNaN(Number(usar.charAt(0))) ? "nombres" : "ci";
    const body = JSON.stringify({ queryParam: usar });
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const json = await res.json();
      if (json.error) {
        alert("Error", json.message, [{ style: "default", onPress: () => {} }]);
        setLoading(false);
        return;
      }
      if (tipo === "ci") {
        setData(json);
        setModalVisible(true);
      } else {
        setLista(json);
      }
    } catch (err) {
      alert("Error", "Ocurrió un error al consultar los datos.", [
        { style: "default", onPress: () => {} },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const EmptyTextComponent = () => (
    <Text style={styles.emptyText}>No hay resultados para mostrar.</Text>
  );

  const renderItem = ({ item }: { item: ConsultaItem }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <FontAwesome5
          name="user-circle"
          size={28}
          color="#1976D2"
          style={{ marginRight: 12 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.nombreComercial}</Text>
          <Text style={styles.cardSubtitle}>CI: {item.identificacion}</Text>
        </View>
        <TouchableOpacity
          style={styles.cardButton}
          onPress={() => {
            if (item.tipoIdentificacion === "R") {
              handleConsulta(item.identificacion.slice(0, -3));
            } else {
              handleConsulta(item.identificacion);
            }
          }}
          accessibilityLabel="Consultar datos"
        >
          <FontAwesome5 name="search" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerBox}>
          <MaterialIcons
            name="person-search"
            size={52}
            color="#1976D2"
            style={{ marginBottom: 8 }}
          />
          <Text style={styles.headerTitle}>Consulta de Datos</Text>
          <Text style={styles.headerSubtitle}>
            Ingrese cédula o nombres completos
          </Text>
        </View>
        <View style={styles.inputSection}>
          <View
            style={[
              styles.inputWrapper,
              inputError && { borderColor: "#e53935" },
            ]}
          >
            <MaterialIcons
              name="search"
              size={22}
              color="#1976D2"
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Cédula o nombres completos"
              value={input}
              onChangeText={handleInputChange}
              onSubmitEditing={() => handleConsulta()}
              style={styles.input}
              returnKeyType="search"
              autoFocus
              accessibilityLabel="Campo de búsqueda"
              maxLength={30}
            />
            {isValidInput && (
              <FontAwesome5
                name="check"
                size={18}
                color="green"
                style={styles.inputIcon}
              />
            )}
          </View>
          {inputError ? (
            <Text style={styles.errorText}>{inputError}</Text>
          ) : null}
          <TouchableOpacity
            style={[
              styles.button,
              !isValidInput && { backgroundColor: "#90caf9" },
            ]}
            onPress={() => handleConsulta()}
            activeOpacity={0.85}
            disabled={!isValidInput}
            accessibilityLabel="Consultar"
          >
            <Text style={styles.buttonText}>Consultar</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={lista}
          renderItem={renderItem}
          keyExtractor={(item) => item.identificacion}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={EmptyTextComponent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyboardShouldPersistTaps="handled"
        />
        <Modal visible={loading} transparent animationType="fade">
          <View style={styles.loadingModal}>
            <ActivityIndicator color="#1976D2" size="large" />
            <Text style={styles.loadingText}>Consultando...</Text>
          </View>
        </Modal>
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <ScrollView contentContainerStyle={styles.modalScrollContent}>
                <Text style={styles.modalTitle}>Resultado de la Consulta</Text>
                {data && (
                  <View>
                    <Section title="Información Personal">
                      <DataItem
                        icon="user"
                        label="Nombres"
                        value={data.nombre}
                      />
                      <DataItem
                        icon="flag"
                        label="Nacionalidad"
                        value={data.nacionalidad}
                      />
                      <DataItem
                        icon="venus-mars"
                        label="Sexo"
                        value={data.sexo}
                      />
                      <DataItem
                        icon="ring"
                        label="Estado Civil"
                        value={data.estadoCivil}
                      />
                      <DataItem
                        icon="user-friends"
                        label="Cónyuge"
                        value={data.conyuge}
                      />
                    </Section>
                    <Section title="Ubicación">
                      <DataItem
                        icon="home"
                        label="Domicilio"
                        value={data.domicilio}
                      />
                      <DataItem icon="road" label="Calle" value={data.calle} />
                      <DataItem
                        icon="building"
                        label="Número de Casa"
                        value={data.numeroCasa}
                      />
                      <DataItem
                        icon="map-marker-alt"
                        label="Lugar de Nacimiento"
                        value={data.lugarNacimiento}
                      />
                    </Section>
                    <Section title="Datos Familiares">
                      <DataItem
                        icon="user"
                        label="Nombre de la Madre"
                        value={data.nombreMadre}
                      />
                      <DataItem
                        icon="user"
                        label="Nombre del Padre"
                        value={data.nombrePadre}
                      />
                    </Section>
                    <Section title="Información Adicional">
                      <DataItem
                        icon="graduation-cap"
                        label="Instrucción"
                        value={data.instruccion}
                      />
                      <DataItem
                        icon="briefcase"
                        label="Profesión"
                        value={data.profesion}
                      />
                      <DataItem
                        icon="id-card"
                        label="Condición Cedulado"
                        value={data.condicionCedulado}
                      />
                    </Section>
                    <Section title="Fechas Importantes">
                      <DataItem
                        icon="calendar"
                        label="Fecha de Nacimiento"
                        value={formatDate(data.fechaNacimiento)}
                      />
                      <DataItem
                        icon="calendar"
                        label="Fecha de Cedulación"
                        value={data.fechaCedulacion}
                      />
                      <DataItem
                        icon="calendar"
                        label="Fecha de Matrimonio"
                        value={data.fechaMatrimonio}
                      />
                      <DataItem
                        icon="calendar"
                        label="Fecha de Fallecimiento"
                        value={data.fechaFallecimiento}
                      />
                    </Section>
                  </View>
                )}
              </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
                accessibilityLabel="Cerrar modal"
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f6fb",
  },
  container: {
    flex: 1,
    paddingHorizontal: width < 500 ? 16 : 32,
    paddingTop: 10,
    backgroundColor: "#f4f6fb",
  },
  headerBox: {
    alignItems: "center",
    marginBottom: 18,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1976D2",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 2,
    textAlign: "center",
  },
  inputSection: {
    marginBottom: 18,
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#e3eaf2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: "#222",
    paddingVertical: 4,
    backgroundColor: "transparent",
  },
  button: {
    backgroundColor: "#1976D2",
    paddingVertical: 13,
    borderRadius: 22,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#1976D2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 4,
    elevation: 2,
    width: "30%",
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  errorText: {
    color: "#e53935",
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 30,
    minHeight: 80,
  },
  emptyText: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
    marginTop: 30,
  },
  separator: {
    height: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#222",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  cardButton: {
    backgroundColor: "#1976D2",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e3eaf2",
    paddingBottom: 3,
  },
  dataItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7fafd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#e3eaf2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  dataTextContainer: {
    flex: 1,
  },
  dataLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 1,
  },
  dataValue: {
    fontSize: 15,
    color: "#222",
  },
  loadingModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  loadingText: {
    color: "#1976D2",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    width: width < 500 ? "92%" : 420,
    maxHeight: height * 0.88,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    alignItems: "center",
  },
  modalScrollContent: {
    paddingBottom: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 18,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#1976D2",
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 22,
    alignItems: "center",
    marginTop: 10,
    alignSelf: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
