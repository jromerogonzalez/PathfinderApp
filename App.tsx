import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@pathfinder_native_character_v13";

const COMPETENCE_BONUS: Record<string, number> = {
  untrained: 0,
  trained: 2,
  expert: 4,
  master: 6,
  legendary: 8,
};

type Proficiency = "untrained" | "trained" | "expert" | "master" | "legendary";

interface SkillData {
  prof: Proficiency;
  item: number;
  armorPen: number;
}

interface SavingThrowData {
  prof: Proficiency;
  item: number;
}

interface AttackData {
  weapon: string;
  attrType: "FUE" | "DES";
  prof: Proficiency;
  item: number;
  diceCount: number;
  diceSize: string;
  specDamage: number;
}

interface CharacterSheet {
  name: string;
  level: number;
  ancestrality: string;
  heritage: string;
  size: string;
  className: string;
  heroPoints: number;
  hpCurrent: number;
  hpMax: number;
  hpTemp: number;
  dying: number;
  wounded: number;
  speed: number;
  armorItemBonus: number;
  armorProficiency: Proficiency;
  perceptionProf: Proficiency;
  perceptionItem: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  fortitude: SavingThrowData;
  reflexes: SavingThrowData;
  will: SavingThrowData;
  acrobatics: SkillData;
  arcana: SkillData;
  athletics: SkillData;
  diplomacy: SkillData;
  deception: SkillData;
  stealth: SkillData;
  intimidation: SkillData;
  thievery: SkillData;
  crafting: SkillData;
  medicine: SkillData;
  nature: SkillData;
  occultism: SkillData;
  performance: SkillData;
  religion: SkillData;
  society: SkillData;
  survival: SkillData;
  meleeAttacks: AttackData[];
  featsText: string;
}

const initialSkill = (): SkillData => ({
  prof: "untrained",
  item: 0,
  armorPen: 0,
});
const initialSave = (p: Proficiency = "untrained"): SavingThrowData => ({
  prof: p,
  item: 0,
});

const defaultFeatsText = `• Dientes Afilados (Linaje 1): Ataque natural de mandíbula (1d6 perf.) con daño de Furia.
• Duro de Matar (General 1): Solo mueres al alcanzar Moribundo 5. Colchón contra críticos.
• Rastreador Experimentado (Habilidad 1): Rastreas a velocidad completa usando Supervivencia.
• Mirada Intimidante (Habilidad 2): Desmoraliza con los ojos. Ignora barreras de idioma y el penalizador de -2.`;

const initialData: CharacterSheet = {
  name: "Bárbaro Hombre Rata (Oso)",
  level: 2,
  ancestrality: "Beastkin (Ysoki)",
  heritage: "Rata de Cloaca",
  size: "Medio",
  className: "Bárbaro (Instinto Animal)",
  heroPoints: 1,
  hpCurrent: 34,
  hpMax: 34,
  hpTemp: 0,
  dying: 0,
  wounded: 0,
  speed: 9,
  armorItemBonus: 2,
  armorProficiency: "trained",
  perceptionProf: "expert",
  perceptionItem: 0,
  strength: 4,
  dexterity: 2,
  constitution: 3,
  intelligence: -1,
  wisdom: 1,
  charisma: 2,
  fortitude: initialSave("expert"),
  reflexes: initialSave("trained"),
  will: initialSave("expert"),
  acrobatics: initialSkill(),
  arcana: initialSkill(),
  athletics: { prof: "trained", item: 0, armorPen: 0 },
  diplomacy: initialSkill(),
  deception: initialSkill(),
  stealth: initialSkill(),
  intimidation: { prof: "trained", item: 0, armorPen: 0 },
  thievery: initialSkill(),
  crafting: initialSkill(),
  medicine: initialSkill(),
  nature: initialSkill(),
  occultism: initialSkill(),
  performance: initialSkill(),
  religion: initialSkill(),
  society: initialSkill(),
  survival: { prof: "trained", item: 0, armorPen: 0 },
  meleeAttacks: [
    {
      weapon: "Fauces de Oso (Ira)",
      attrType: "FUE",
      prof: "trained",
      item: 0,
      diceCount: 1,
      diceSize: "d10",
      specDamage: 2,
    },
    {
      weapon: "Garras de Oso (Ira)",
      attrType: "FUE",
      prof: "trained",
      item: 0,
      diceCount: 1,
      diceSize: "d6",
      specDamage: 2,
    },
  ],
  featsText: defaultFeatsText,
};

const PROF_LABELS: { label: string; value: Proficiency }[] = [
  { label: "S", value: "untrained" },
  { label: "E", value: "trained" },
  { label: "EX", value: "expert" },
  { label: "M", value: "master" },
  { label: "L", value: "legendary" },
];

export default function App() {
  const [character, setCharacter] = useState<CharacterSheet>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const { width } = useWindowDimensions();

  const [openBio, setOpenBio] = useState(true);
  const [openAttr, setOpenAttr] = useState(false);
  const [openSaves, setOpenSaves] = useState(false);
  const [openAttacks, setOpenAttacks] = useState(true);
  const [openSkills, setOpenSkills] = useState(false);
  const [openFeats, setOpenFeats] = useState(false);

  useEffect(() => {
    const loadCharacterData = async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData !== null) {
          setCharacter(JSON.parse(savedData));
        }
      } catch (error) {
        console.error("Error al leer el disco nativo:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCharacterData();
  }, []);

  const saveCharacterData = async (updatedCharacter: CharacterSheet) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCharacter));
    } catch (error) {
      console.error("Error al escribir en el disco nativo:", error);
    }
  };

  const updateField = (field: keyof CharacterSheet, value: any) => {
    const parsedValue =
      typeof character[field] === "number" ? parseInt(value) || 0 : value;
    const updatedCharacter = { ...character, [field]: parsedValue };
    setCharacter(updatedCharacter);
    saveCharacterData(updatedCharacter);
  };

  const handleHeroPoints = (point: number) => {
    let newPoints = point;
    if (character.heroPoints === point) {
      newPoints = point - 1;
    }
    updateField("heroPoints", newPoints);
  };

  const updateSkill = (
    skillKey: keyof CharacterSheet,
    subField: keyof SkillData,
    value: any,
  ) => {
    const currentSkill = character[skillKey] as SkillData;
    const parsedValue = subField === "prof" ? value : parseInt(value) || 0;
    const updatedCharacter = {
      ...character,
      [skillKey]: { ...currentSkill, [subField]: parsedValue },
    };
    setCharacter(updatedCharacter);
    saveCharacterData(updatedCharacter);
  };

  const updateSave = (
    saveKey: "fortitude" | "reflexes" | "will",
    subField: keyof SavingThrowData,
    value: any,
  ) => {
    const currentSave = character[saveKey];
    const parsedValue = subField === "prof" ? value : parseInt(value) || 0;
    const updatedCharacter = {
      ...character,
      [saveKey]: { ...currentSave, [subField]: parsedValue },
    };
    setCharacter(updatedCharacter);
    saveCharacterData(updatedCharacter);
  };

  const addMeleeAttack = () => {
    const newAttack: AttackData = {
      weapon: "Nueva Arma / Ataque",
      attrType: "FUE",
      prof: "trained",
      item: 0,
      diceCount: 1,
      diceSize: "d6",
      specDamage: 0,
    };
    const updatedAttacks = [...character.meleeAttacks, newAttack];
    const updatedCharacter = { ...character, meleeAttacks: updatedAttacks };
    setCharacter(updatedCharacter);
    saveCharacterData(updatedCharacter);
  };

  const updateAttack = (
    index: number,
    subField: keyof AttackData,
    value: any,
  ) => {
    const updatedAttacks = [...character.meleeAttacks];
    let parsedValue = value;
    if (
      subField === "item" ||
      subField === "diceCount" ||
      subField === "specDamage"
    ) {
      parsedValue = parseInt(value) || 0;
    }
    updatedAttacks[index] = {
      ...updatedAttacks[index],
      [subField]: parsedValue,
    };
    const updatedCharacter = { ...character, meleeAttacks: updatedAttacks };
    setCharacter(updatedCharacter);
    saveCharacterData(updatedCharacter);
  };

  const removeAttack = (index: number) => {
    const updatedAttacks = character.meleeAttacks.filter((_, i) => i !== index);
    const updatedCharacter = { ...character, meleeAttacks: updatedAttacks };
    setCharacter(updatedCharacter);
    saveCharacterData(updatedCharacter);
  };

  const getProfBonus = (prof: Proficiency) => {
    return COMPETENCE_BONUS[prof] > 0
      ? COMPETENCE_BONUS[prof] + character.level
      : 0;
  };

  const calculateAC = () => {
    return (
      10 +
      character.dexterity +
      character.armorItemBonus +
      getProfBonus(character.armorProficiency)
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#004424" />
        <Text style={styles.loadingText}>
          Sincronizando sistemas robóticos...
        </Text>
      </SafeAreaView>
    );
  }

  const skillsList: {
    name: string;
    field: keyof CharacterSheet;
    attrName: string;
    attrVal: number;
  }[] = [
    {
      name: "Acrobacias",
      field: "acrobatics",
      attrName: "DES",
      attrVal: character.dexterity,
    },
    {
      name: "Arcanismo",
      field: "arcana",
      attrName: "INT",
      attrVal: character.intelligence,
    },
    {
      name: "Atletismo",
      field: "athletics",
      attrName: "FUE",
      attrVal: character.strength,
    },
    {
      name: "Diplomacia",
      field: "diplomacy",
      attrName: "CAR",
      attrVal: character.charisma,
    },
    {
      name: "Disimulo",
      field: "deception",
      attrName: "CAR",
      attrVal: character.charisma,
    },
    {
      name: "Furtividad",
      field: "stealth",
      attrName: "DES",
      attrVal: character.dexterity,
    },
    {
      name: "Intimidación",
      field: "intimidation",
      attrName: "CAR",
      attrVal: character.charisma,
    },
    {
      name: "Latrocinio",
      field: "thievery",
      attrName: "DES",
      attrVal: character.dexterity,
    },
    {
      name: "Manufactura",
      field: "crafting",
      attrName: "INT",
      attrVal: character.intelligence,
    },
    {
      name: "Medicina",
      field: "medicine",
      attrName: "SAB",
      attrVal: character.wisdom,
    },
    {
      name: "Naturaleza",
      field: "nature",
      attrName: "SAB",
      attrVal: character.wisdom,
    },
    {
      name: "Ocultismo",
      field: "occultism",
      attrName: "INT",
      attrVal: character.intelligence,
    },
    {
      name: "Performance",
      field: "performance",
      attrName: "CAR",
      attrVal: character.charisma,
    },
    {
      name: "Religión",
      field: "religion",
      attrName: "SAB",
      attrVal: character.wisdom,
    },
    {
      name: "Sociedad",
      field: "society",
      attrName: "INT",
      attrVal: character.intelligence,
    },
    {
      name: "Supervivencia",
      field: "survival",
      attrName: "SAB",
      attrVal: character.wisdom,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { width: width }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* CABECERA */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>PATHFINDER</Text>
            <View style={styles.headerSubtitleContainer}>
              <Text style={styles.headerSubtitle}>Ficha Móvil de Campaña</Text>
            </View>
          </View>

          {/* COLAPSABLE: IDENTIDAD */}
          <TouchableOpacity
            style={styles.summary}
            onPress={() => setOpenBio(!openBio)}
          >
            <Text style={styles.summaryText}>Identidad y Biografía</Text>
            <Text style={styles.summaryArrow}>{openBio ? "▼" : "►"}</Text>
          </TouchableOpacity>
          {openBio && (
            <View style={styles.detailsBox}>
              <View style={styles.verticalField}>
                <Text style={styles.fieldLabelPrimary}>
                  Nombre del Personaje
                </Text>
                <TextInput
                  style={styles.inputBold}
                  value={character.name}
                  onChangeText={(text) => updateField("name", text)}
                />
              </View>
              <View style={styles.verticalField}>
                <Text style={styles.fieldLabel}>Clase y Senda</Text>
                <TextInput
                  style={styles.input}
                  value={character.className}
                  onChangeText={(text) => updateField("className", text)}
                />
              </View>
              <View style={styles.verticalField}>
                <Text style={styles.fieldLabel}>Ancestralidad</Text>
                <TextInput
                  style={styles.input}
                  value={character.ancestrality}
                  onChangeText={(text) => updateField("ancestrality", text)}
                />
              </View>
              <View style={styles.verticalField}>
                <Text style={styles.fieldLabel}>Herencia</Text>
                <TextInput
                  style={styles.input}
                  value={character.heritage}
                  onChangeText={(text) => updateField("heritage", text)}
                />
              </View>
              <View style={styles.rowLayout}>
                <View
                  style={[styles.verticalField, { flex: 1, marginRight: 6 }]}
                >
                  <Text style={styles.fieldLabel}>Nivel</Text>
                  <TextInput
                    style={styles.inputCenterBold}
                    keyboardType="numeric"
                    value={character.level.toString()}
                    onChangeText={(text) => updateField("level", text)}
                  />
                </View>
                <View
                  style={[styles.verticalField, { flex: 1, marginLeft: 6 }]}
                >
                  <Text style={styles.fieldLabel}>Tamaño</Text>
                  <TextInput
                    style={styles.inputCenter}
                    value={character.size}
                    onChangeText={(text) => updateField("size", text)}
                  />
                </View>
              </View>
              <View style={styles.heroPointsContainer}>
                <Text style={styles.fieldLabelPrimary}>
                  Puntos Heroicos (Toca para activar/desactivar)
                </Text>
                <View style={styles.rowLayout}>
                  {[1, 2, 3].map((i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleHeroPoints(i)}
                      style={[
                        styles.heroButton,
                        character.heroPoints >= i
                          ? styles.heroButtonActive
                          : styles.heroButtonInactive,
                      ]}
                    >
                      <Text
                        style={
                          character.heroPoints >= i
                            ? styles.heroTextActive
                            : styles.heroTextInactive
                        }
                      >
                        {i}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* COMBATE, DEFENSA Y VITALIDAD */}
          <View style={styles.combateCard}>
            <View style={styles.rowLayout}>
              <View style={[styles.quickStatBox, { marginRight: 4 }]}>
                <Text style={styles.quickStatLabelPrimary}>CA</Text>
                <Text style={styles.quickStatValuePrimary}>
                  {calculateAC()}
                </Text>
              </View>
              <View style={[styles.quickStatBox, { marginHorizontal: 4 }]}>
                <Text style={styles.quickStatLabel}>Vida Actual</Text>
                <TextInput
                  style={styles.hpInput}
                  keyboardType="numeric"
                  value={character.hpCurrent.toString()}
                  onChangeText={(text) => updateField("hpCurrent", text)}
                />
              </View>
              <View style={[styles.quickStatBox, { marginLeft: 4 }]}>
                <Text style={styles.quickStatLabel}>Velocidad</Text>
                <View style={styles.speedRow}>
                  <TextInput
                    style={styles.speedInput}
                    keyboardType="numeric"
                    value={character.speed.toString()}
                    onChangeText={(text) => updateField("speed", text)}
                  />
                  <Text style={styles.unitText}>m</Text>
                </View>
              </View>
            </View>

            <View style={styles.hpManagerBox}>
              <Text style={styles.subBoxLabel}>Puntos de Golpe Máximos</Text>
              <TextInput
                style={styles.inputCenterBoldText}
                keyboardType="numeric"
                value={character.hpMax.toString()}
                onChangeText={(text) => updateField("hpMax", text)}
              />

              <View style={styles.statesRow}>
                <View style={styles.stateCell}>
                  <Text style={styles.stateLabelDying}>Moribundo</Text>
                  <TextInput
                    style={styles.stateInputDying}
                    keyboardType="numeric"
                    value={character.dying.toString()}
                    onChangeText={(text) => updateField("dying", text)}
                  />
                </View>
                <View style={styles.stateCell}>
                  <Text style={styles.stateLabelWounded}>Herido</Text>
                  <TextInput
                    style={styles.stateInputWounded}
                    keyboardType="numeric"
                    value={character.wounded.toString()}
                    onChangeText={(text) => updateField("wounded", text)}
                  />
                </View>
              </View>
            </View>

            {/* PERCEPCIÓN */}
            <View style={styles.perceptionContainerIndependent}>
              <Text style={styles.quickStatLabelPrimary}>Percepción</Text>
              <View
                style={[
                  styles.rowLayout,
                  { alignItems: "center", marginTop: 4 },
                ]}
              >
                <View style={styles.selectorRowGroup}>
                  {PROF_LABELS.map((p) => (
                    <TouchableOpacity
                      key={p.value}
                      onPress={() => updateField("perceptionProf", p.value)}
                      style={[
                        styles.selectorButtonState,
                        character.perceptionProf === p.value
                          ? styles.selectorButtonActive
                          : styles.selectorButtonInactive,
                      ]}
                    >
                      <Text
                        style={
                          character.perceptionProf === p.value
                            ? styles.selectorTextActive
                            : styles.selectorTextInactive
                        }
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.modBadge}>
                  <Text style={styles.modBadgeText}>
                    +
                    {character.wisdom +
                      getProfBonus(character.perceptionProf) +
                      character.perceptionItem}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* COLAPSABLE: ATRIBUTOS PRIMARIOS */}
          <TouchableOpacity
            style={styles.summary}
            onPress={() => setOpenAttr(!openAttr)}
          >
            <Text style={styles.summaryText}>Atributos Primarios</Text>
            <Text style={styles.summaryArrow}>{openAttr ? "▼" : "►"}</Text>
          </TouchableOpacity>
          {openAttr && (
            <View style={styles.detailsBox}>
              {[
                { label: "Fuerza (FUE)", field: "strength" },
                { label: "Destreza (DES)", field: "dexterity" },
                { label: "Constitución (CON)", field: "constitution" },
                { label: "Inteligencia (INT)", field: "intelligence" },
                { label: "Sabiduría (SAB)", field: "wisdom" },
                { label: "Carisma (CAR)", field: "charisma" },
              ].map((attr) => (
                <View key={attr.field} style={styles.attrRowIndependent}>
                  <Text style={styles.attrLabelText}>{attr.label}</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <TextInput
                      style={styles.attrInputBox}
                      keyboardType="numeric"
                      value={character[
                        attr.field as keyof CharacterSheet
                      ].toString()}
                      onChangeText={(text) =>
                        updateField(attr.field as keyof CharacterSheet, text)
                      }
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* COLAPSABLE: SALVACIONES */}
          <TouchableOpacity
            style={styles.summary}
            onPress={() => setOpenSaves(!openSaves)}
          >
            <Text style={styles.summaryText}>Defensas de Salvación</Text>
            <Text style={styles.summaryArrow}>{openSaves ? "▼" : "►"}</Text>
          </TouchableOpacity>
          {openSaves && (
            <View style={styles.detailsBox}>
              {[
                {
                  name: "Fortaleza (CON)",
                  field: "fortitude",
                  attrVal: character.constitution,
                },
                {
                  name: "Reflejos (DES)",
                  field: "reflexes",
                  attrVal: character.dexterity,
                },
                {
                  name: "Voluntad (SAB)",
                  field: "will",
                  attrVal: character.wisdom,
                },
              ].map((save) => {
                const saveData =
                  character[save.field as "fortitude" | "reflexes" | "will"];
                const totalSave =
                  save.attrVal + getProfBonus(saveData.prof) + saveData.item;
                return (
                  <View key={save.field} style={styles.saveContainerBlock}>
                    <Text style={styles.saveTitleName}>{save.name}</Text>
                    <View
                      style={[
                        styles.rowLayout,
                        { alignItems: "center", marginTop: 4 },
                      ]}
                    >
                      <View style={styles.selectorRowGroup}>
                        {PROF_LABELS.map((p) => (
                          <TouchableOpacity
                            key={p.value}
                            onPress={() =>
                              updateSave(save.field as any, "prof", p.value)
                            }
                            style={[
                              styles.selectorButtonState,
                              saveData.prof === p.value
                                ? styles.selectorButtonActive
                                : styles.selectorButtonInactive,
                            ]}
                          >
                            <Text
                              style={
                                saveData.prof === p.value
                                  ? styles.selectorTextActive
                                  : styles.selectorTextInactive
                              }
                            >
                              {p.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.modBadge}>
                        <Text style={styles.modBadgeText}>
                          {totalSave >= 0 ? `+${totalSave}` : totalSave}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* COLAPSABLE: GOLPES */}
          <TouchableOpacity
            style={styles.summary}
            onPress={() => setOpenAttacks(!openAttacks)}
          >
            <Text style={styles.summaryText}>Golpes y Armas Múltiples</Text>
            <Text style={styles.summaryArrow}>{openAttacks ? "▼" : "►"}</Text>
          </TouchableOpacity>
          {openAttacks && (
            <View style={styles.detailsBox}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.weaponTypeHeader}>Cuerpo a Cuerpo</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addMeleeAttack}
                >
                  <Text style={styles.addButtonText}>+ Añadir Arma</Text>
                </TouchableOpacity>
              </View>

              {character.meleeAttacks.map((attack, index) => {
                const modifierAttr =
                  attack.attrType === "FUE"
                    ? character.strength
                    : character.dexterity;
                const atkBonus =
                  modifierAttr + getProfBonus(attack.prof) + attack.item;
                return (
                  <View key={index} style={styles.weaponAtkCardModifier}>
                    <View style={styles.rowLayout}>
                      <TextInput
                        style={styles.weaponInputNameEditable}
                        value={attack.weapon}
                        onChangeText={(t) => updateAttack(index, "weapon", t)}
                      />
                      <TouchableOpacity
                        style={styles.removeWeaponButton}
                        onPress={() => removeAttack(index)}
                      >
                        <Text style={styles.removeWeaponButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    <View
                      style={[
                        styles.rowLayout,
                        { marginTop: 6, gap: 6, alignItems: "center" },
                      ]}
                    >
                      <View style={{ flex: 1.5 }}>
                        <Text style={styles.fieldLabel}>Competencia</Text>
                        <View style={styles.selectorRowGroupSmall}>
                          {PROF_LABELS.map((p) => (
                            <TouchableOpacity
                              key={p.value}
                              onPress={() =>
                                updateAttack(index, "prof", p.value)
                              }
                              style={[
                                styles.selectorButtonStateSmall,
                                attack.prof === p.value
                                  ? styles.selectorButtonActive
                                  : styles.selectorButtonInactive,
                              ]}
                            >
                              <Text
                                style={
                                  attack.prof === p.value
                                    ? styles.selectorTextActiveSmall
                                    : styles.selectorTextInactiveSmall
                                }
                              >
                                {p.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View style={{ flex: 0.8 }}>
                        <Text style={styles.fieldLabel}>Cant Dados</Text>
                        <TextInput
                          style={styles.inputCenter}
                          keyboardType="numeric"
                          value={attack.diceCount.toString()}
                          onChangeText={(t) =>
                            updateAttack(index, "diceCount", t)
                          }
                        />
                      </View>

                      <View style={{ flex: 0.8 }}>
                        <Text style={styles.fieldLabel}>Tipo Dado</Text>
                        <TextInput
                          style={styles.inputCenter}
                          value={attack.diceSize}
                          onChangeText={(t) =>
                            updateAttack(index, "diceSize", t)
                          }
                        />
                      </View>

                      <View style={{ flex: 0.8 }}>
                        <Text style={styles.fieldLabel}>Daño Esp.</Text>
                        <TextInput
                          style={styles.inputCenter}
                          keyboardType="numeric"
                          value={attack.specDamage.toString()}
                          onChangeText={(t) =>
                            updateAttack(index, "specDamage", t)
                          }
                        />
                      </View>
                    </View>

                    <View
                      style={[
                        styles.rowLayout,
                        {
                          marginTop: 8,
                          justifyContent: "space-between",
                          borderTopWidth: 1,
                          borderTopColor: "#f4f4f5",
                          paddingTop: 4,
                        },
                      ]}
                    >
                      <Text style={styles.computedAttackResult}>
                        Total Ataque:{" "}
                        <Text style={{ color: "#004424" }}>+{atkBonus}</Text>
                      </Text>
                      <Text style={styles.computedAttackResult}>
                        Total Daño:{" "}
                        <Text style={{ color: "#a62b17" }}>
                          {attack.diceCount}
                          {attack.diceSize} +{" "}
                          {character.strength + attack.specDamage}
                        </Text>
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* COLAPSABLE: PERÍCIAS */}
          <TouchableOpacity
            style={styles.summary}
            onPress={() => setOpenSkills(!openSkills)}
          >
            <Text style={styles.summaryText}>Pericias y Habilidades</Text>
            <Text style={styles.summaryArrow}>{openSkills ? "▼" : "►"}</Text>
          </TouchableOpacity>
          {openSkills && (
            <View style={styles.detailsBox}>
              {skillsList.map((skill) => {
                const skillData = character[skill.field] as SkillData;
                const total =
                  skill.attrVal +
                  getProfBonus(skillData.prof) +
                  skillData.item -
                  skillData.armorPen;

                return (
                  <View key={skill.field} style={styles.skillContainerCard}>
                    <View style={[styles.rowLayout, styles.skillHeaderDivider]}>
                      <Text style={styles.skillMainName}>
                        {skill.name}{" "}
                        <Text style={styles.skillAttrHint}>
                          ({skill.attrName})
                        </Text>
                      </Text>
                      <View style={styles.skillTotalBadge}>
                        <Text style={styles.skillTotalText}>
                          {total >= 0 ? `+${total}` : total}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.rowLayout,
                        { alignItems: "center", marginTop: 4 },
                      ]}
                    >
                      <View
                        style={[
                          styles.selectorRowGroup,
                          { flex: 1, marginRight: 6 },
                        ]}
                      >
                        {PROF_LABELS.map((p) => (
                          <TouchableOpacity
                            key={p.value}
                            onPress={() =>
                              updateSkill(skill.field, "prof", p.value)
                            }
                            style={[
                              styles.selectorButtonStateSmall,
                              skillData.prof === p.value
                                ? styles.selectorButtonActive
                                : styles.selectorButtonInactive,
                            ]}
                          >
                            <Text
                              style={
                                skillData.prof === p.value
                                  ? styles.selectorTextActiveSmall
                                  : styles.selectorTextInactiveSmall
                              }
                            >
                              {p.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={{ width: 40, marginRight: 4 }}>
                        <TextInput
                          style={styles.skillNumberInput}
                          keyboardType="numeric"
                          value={skillData.item.toString()}
                          onChangeText={(t) =>
                            updateSkill(skill.field, "item", t)
                          }
                          placeholder="Itm"
                        />
                      </View>
                      <View style={{ width: 40 }}>
                        <TextInput
                          style={[
                            styles.skillNumberInput,
                            { color: "#a62b17" },
                          ]}
                          keyboardType="numeric"
                          value={skillData.armorPen.toString()}
                          onChangeText={(t) =>
                            updateSkill(skill.field, "armorPen", t)
                          }
                          placeholder="Pen"
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* COLAPSABLE: CÓDICE DE TALENTOS */}
          <TouchableOpacity
            style={styles.summary}
            onPress={() => setOpenFeats(!openFeats)}
          >
            <Text style={styles.summaryText}>Códice de Talentos</Text>
            <Text style={styles.summaryArrow}>{openFeats ? "▼" : "►"}</Text>
          </TouchableOpacity>
          {openFeats && (
            <View style={styles.detailsBox}>
              <TextInput
                style={styles.featsTextArea}
                multiline
                value={character.featsText}
                onChangeText={(text) => updateField("featsText", text)}
                underlineColorAndroid="transparent"
              />
            </View>
          )}

          {/* ESPACIADOR INFERIOR DE SEGURIDAD MÓVIL */}
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "bold",
    color: "#004424",
  },
  scrollContainer: { padding: 14, backgroundColor: "#ffffff" },
  header: {
    borderBottomWidth: 4,
    borderBottomColor: "#004424",
    paddingBottom: 6,
    marginBottom: 16,
    alignItems: "center",
  },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#004424" },
  headerSubtitleContainer: {
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginTop: 4,
    borderRadius: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#004424",
  },
  summary: {
    backgroundColor: "#004424",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase",
  },
  summaryArrow: { fontSize: 10, color: "#ffffff", opacity: 0.8 },
  detailsBox: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d4d4d8",
    padding: 12,
    backgroundColor: "#fcfbfa",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    flexDirection: "column",
    gap: 10,
    width: "100%",
  },
  verticalField: { flexDirection: "column", gap: 4, width: "100%" },
  fieldLabelPrimary: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#004424",
  },
  fieldLabel: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#71717a",
    marginBottom: 2,
  },
  inputBold: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: "bold",
    backgroundColor: "#ffffff",
    color: "#004424",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  rowLayout: { flexDirection: "row", width: "100%" },
  inputCenterBold: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 4,
    paddingVertical: 6,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "bold",
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  inputCenter: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 4,
    paddingVertical: 4,
    textAlign: "center",
    fontSize: 11,
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  heroPointsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingTop: 8,
    marginTop: 4,
  },
  heroButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  heroButtonActive: { backgroundColor: "#004424", borderColor: "#004424" },
  heroButtonInactive: { backgroundColor: "#ffffff", borderColor: "#d4d4d8" },
  heroTextActive: { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
  heroTextInactive: { color: "#a1a1aa", fontSize: 12, fontWeight: "bold" },
  combateCard: {
    borderWidth: 1,
    borderColor: "#a1a1aa",
    borderRadius: 4,
    padding: 12,
    backgroundColor: "#ffffff",
    flexDirection: "column",
    gap: 12,
    marginVertical: 4,
    width: "100%",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickStatBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  quickStatLabelPrimary: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#004424",
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#71717a",
    marginBottom: 2,
  },
  quickStatValuePrimary: { fontSize: 24, fontWeight: "900", color: "#004424" },
  hpInput: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d8",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
    color: "#065f46",
    padding: 0,
  },
  speedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  speedInput: {
    width: 30,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "bold",
    padding: 0,
    color: "#000000",
  },
  unitText: { fontSize: 10, color: "#71717a", marginLeft: 1 },
  hpManagerBox: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    padding: 10,
    borderRadius: 4,
    backgroundColor: "#fcfbfa",
    flexDirection: "column",
    gap: 6,
  },
  subBoxLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#004424",
    textTransform: "uppercase",
    textAlign: "center",
  },
  inputCenterBoldText: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
    paddingVertical: 4,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "#ffffff",
    color: "#52525b",
  },
  statesRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingTop: 8,
    marginTop: 4,
    gap: 8,
  },
  stateCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
    padding: 4,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  stateLabelDying: { fontSize: 9, fontWeight: "bold", color: "#991b1b" },
  stateLabelWounded: { fontSize: 9, fontWeight: "bold", color: "#92400e" },
  stateInputDying: {
    width: "100%",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 13,
    color: "#991b1b",
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  stateInputWounded: {
    width: "100%",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 13,
    color: "#92400e",
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },

  perceptionContainerIndependent: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#f4f4f5",
  },
  selectorRowGroup: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#e4e4e7",
    borderRadius: 6,
    padding: 2,
    marginRight: 8,
  },
  selectorButtonState: {
    flex: 1,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  selectorButtonActive: { backgroundColor: "#004424" },
  selectorButtonInactive: { backgroundColor: "transparent" },
  selectorTextActive: { color: "#ffffff", fontSize: 11, fontWeight: "900" },
  selectorTextInactive: { color: "#52525b", fontSize: 11, fontWeight: "bold" },

  selectorRowGroupSmall: {
    flexDirection: "row",
    backgroundColor: "#e4e4e7",
    borderRadius: 4,
    padding: 1.5,
  },
  selectorButtonStateSmall: {
    flex: 1,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 3,
  },
  selectorTextActiveSmall: { color: "#ffffff", fontSize: 9, fontWeight: "900" },
  selectorTextInactiveSmall: {
    color: "#52525b",
    fontSize: 9,
    fontWeight: "bold",
  },

  modBadge: {
    width: 38,
    height: 32,
    borderWidth: 1,
    borderColor: "#004424",
    backgroundColor: "#ffffff",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  modBadgeText: { fontSize: 13, fontWeight: "900", color: "#004424" },

  attrRowIndependent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#ffffff",
  },
  attrLabelText: { fontSize: 11, fontWeight: "bold", color: "#3f3f46" },
  attrInputBox: {
    width: 44,
    borderWidth: 1,
    borderColor: "#a1a1aa",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 12,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#f4f4f5",
    color: "#004424",
  },

  saveContainerBlock: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    width: "100%",
  },
  saveTitleName: { fontSize: 11, fontWeight: "bold", color: "#27272a" },

  weaponTypeHeader: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#004424",
  },
  addButton: {
    backgroundColor: "#004424",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  addButtonText: { color: "#ffffff", fontSize: 11, fontWeight: "bold" },
  weaponAtkCardModifier: {
    backgroundColor: "#ffffff",
    padding: 10,
    borderWidth: 1,
    borderColor: "#b4b4b8",
    borderRadius: 6,
    flexDirection: "column",
    marginTop: 4,
  },
  weaponInputNameEditable: {
    flex: 1,
    fontSize: 12,
    fontWeight: "bold",
    color: "#4a1a12",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#fafafa",
  },
  removeWeaponButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#991b1b",
    borderRadius: 4,
  },
  removeWeaponButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
  computedAttackResult: { fontSize: 11, fontWeight: "bold", color: "#27272a" },

  skillContainerCard: {
    backgroundColor: "#ffffff",
    padding: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 4,
    flexDirection: "column",
  },
  skillHeaderDivider: { justifyContent: "space-between", alignItems: "center" },
  skillMainName: { fontSize: 11, fontWeight: "bold", color: "#004424" },
  skillAttrHint: { fontSize: 9, color: "#a1a1aa", fontWeight: "normal" },
  skillTotalBadge: {
    width: 28,
    height: 22,
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#004424",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  skillTotalText: { fontSize: 11, fontWeight: "bold", color: "#004424" },
  skillSubInputCell: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
    padding: 4,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  skillNumberInput: {
    width: "100%",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 11,
    color: "#3f3f46",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 4,
    paddingVertical: 2,
    backgroundColor: "#ffffff",
  },
  featsTextArea: {
    width: "100%",
    backgroundColor: "#fdfae6",
    borderWidth: 1,
    borderColor: "#e3dcb1",
    fontSize: 11,
    padding: 10,
    borderRadius: 4,
    minHeight: 140,
    color: "#2d1e10",
    textAlignVertical: "top",
  },
});
