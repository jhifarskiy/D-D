package com.dnd.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "characters")
public class Character {
    @Id
    private String id;
    private String name;

    // Поля для характеристик
    private int strength;
    private int dexterity;
    private int constitution;
    private int intell;
    private int wisdom;
    private int charisma;

    // Новые поля
    private int proficiencyBonus; // Бонус мастерства
    private boolean strengthSaveProficient;
    private boolean dexteritySaveProficient;
    private boolean constitutionSaveProficient;
    private boolean intellSaveProficient;
    private boolean wisdomSaveProficient;
    private boolean charismaSaveProficient;

    // Навыки (будут храниться как состояния мастерства)
    private boolean acrobaticsProficient;
    private boolean animalHandlingProficient;
    private boolean arcanaProficient;
    private boolean athleticsProficient;
    private boolean deceptionProficient;
    private boolean historyProficient;
    private boolean insightProficient;
    private boolean intimidationProficient;
    private boolean investigationProficient;
    private boolean medicineProficient;
    private boolean natureProficient;
    private boolean perceptionProficient;
    private boolean performanceProficient;
    private boolean persuasionProficient;
    private boolean religionProficient;
    private boolean sleightOfHandProficient;
    private boolean stealthProficient;
    private boolean survivalProficient;

    // Новые поля для снаряжения и заклинаний
    private List<Equipment> equipment = new ArrayList<>(); // Список снаряжения
    private List<Spell> spells = new ArrayList<>(); // Список заклинаний

    // Поля для положения персонажа на карте
    private int mapX;
    private int mapY;

    // Конструктор по умолчанию
    public Character() {
        this.name = "Либериус";
        this.strength = 10;
        this.dexterity = 10;
        this.constitution = 10;
        this.intell = 10;
        this.wisdom = 10;
        this.charisma = 10;
        this.proficiencyBonus = 2;

        this.strengthSaveProficient = false;
        this.dexteritySaveProficient = false;
        this.constitutionSaveProficient = false;
        this.intellSaveProficient = false;
        this.wisdomSaveProficient = false;
        this.charismaSaveProficient = false;

        this.acrobaticsProficient = false;
        this.animalHandlingProficient = false;
        this.arcanaProficient = false;
        this.athleticsProficient = false;
        this.deceptionProficient = false;
        this.historyProficient = false;
        this.insightProficient = false;
        this.intimidationProficient = false;
        this.investigationProficient = false;
        this.medicineProficient = false;
        this.natureProficient = false;
        this.perceptionProficient = false;
        this.performanceProficient = false;
        this.persuasionProficient = false;
        this.religionProficient = false;
        this.sleightOfHandProficient = false;
        this.stealthProficient = false;
        this.survivalProficient = false;

        // Дефолтные значения для карты
        this.mapX = 0;
        this.mapY = 0;
    }

    // --- Геттеры и Сеттеры ---
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getStrength() { return strength; }
    public void setStrength(int strength) { this.strength = strength; }
    public int getDexterity() { return dexterity; }
    public void setDexterity(int dexterity) { this.dexterity = dexterity; }
    public int getConstitution() { return constitution; }
    public void setConstitution(int constitution) { this.constitution = constitution; }
    public int getIntell() { return intell; }
    public void setIntell(int intell) { this.intell = intell; }
    public int getWisdom() { return wisdom; }
    public void setWisdom(int wisdom) { this.wisdom = wisdom; }
    public int getCharisma() { return charisma; }
    public void setCharisma(int charisma) { this.charisma = charisma; }

    public int getProficiencyBonus() { return proficiencyBonus; }
    public void setProficiencyBonus(int proficiencyBonus) { this.proficiencyBonus = proficiencyBonus; }

    public boolean isStrengthSaveProficient() { return strengthSaveProficient; }
    public void setStrengthSaveProficient(boolean strengthSaveProficient) { this.strengthSaveProficient = strengthSaveProficient; }
    public boolean isDexteritySaveProficient() { return dexteritySaveProficient; }
    public void setDexteritySaveProficient(boolean dexteritySaveProficient) { this.dexteritySaveProficient = dexteritySaveProficient; }
    public boolean isConstitutionSaveProficient() { return constitutionSaveProficient; }
    public void setConstitutionSaveProficient(boolean constitutionSaveProficient) { this.constitutionSaveProficient = constitutionSaveProficient; }
    public boolean isIntellSaveProficient() { return intellSaveProficient; }
    public void setIntellSaveProficient(boolean intellSaveProficient) { this.intellSaveProficient = intellSaveProficient; }
    public boolean isWisdomSaveProficient() { return wisdomSaveProficient; }
    public void setWisdomSaveProficient(boolean wisdomSaveProficient) { this.wisdomSaveProficient = wisdomSaveProficient; }
    public boolean isCharismaSaveProficient() { return charismaSaveProficient; }
    public void setCharismaSaveProficient(boolean charismaSaveProficient) { this.charismaSaveProficient = charismaSaveProficient; }

    public boolean isAcrobaticsProficient() { return acrobaticsProficient; }
    public void setAcrobaticsProficient(boolean acrobaticsProficient) { this.acrobaticsProficient = acrobaticsProficient; }
    public boolean isAnimalHandlingProficient() { return animalHandlingProficient; }
    public void setAnimalHandlingProficient(boolean animalHandlingProficient) { this.animalHandlingProficient = animalHandlingProficient; }
    public boolean isArcanaProficient() { return arcanaProficient; }
    public void setArcanaProficient(boolean arcanaProficient) { this.arcanaProficient = arcanaProficient; }
    public boolean isAthleticsProficient() { return athleticsProficient; }
    public void setAthleticsProficient(boolean athleticsProficient) { this.athleticsProficient = athleticsProficient; }
    public boolean isDeceptionProficient() { return deceptionProficient; }
    public void setDeceptionProficient(boolean deceptionProficient) { this.deceptionProficient = deceptionProficient; }
    public boolean isHistoryProficient() { return historyProficient; }
    public void setHistoryProficient(boolean historyProficient) { this.historyProficient = historyProficient; }
    public boolean isInsightProficient() { return insightProficient; }
    public void setInsightProficient(boolean insightProficient) { this.insightProficient = insightProficient; }
    public boolean isIntimidationProficient() { return intimidationProficient; }
    public void setIntimidationProficient(boolean intimidationProficient) { this.intimidationProficient = intimidationProficient; }
    public boolean isInvestigationProficient() { return investigationProficient; }
    public void setInvestigationProficient(boolean investigationProficient) { this.investigationProficient = investigationProficient; }
    public boolean isMedicineProficient() { return medicineProficient; }
    public void setMedicineProficient(boolean medicineProficient) { this.medicineProficient = medicineProficient; }
    public boolean isNatureProficient() { return natureProficient; }
    public void setNatureProficient(boolean natureProficient) { this.natureProficient = natureProficient; }
    public boolean isPerceptionProficient() { return perceptionProficient; }
    public void setPerceptionProficient(boolean perceptionProficient) { this.perceptionProficient = perceptionProficient; }
    public boolean isPerformanceProficient() { return performanceProficient; }
    public void setPerformanceProficient(boolean performanceProficient) { this.performanceProficient = performanceProficient; }
    public boolean isPersuasionProficient() { return persuasionProficient; }
    public void setPersuasionProficient(boolean persuasionProficient) { this.persuasionProficient = persuasionProficient; }
    public boolean isReligionProficient() { return religionProficient; }
    public void setReligionProficient(boolean religionProficient) { this.religionProficient = religionProficient; }
    public boolean isSleightOfHandProficient() { return sleightOfHandProficient; }
    public void setSleightOfHandProficient(boolean sleightOfHandProficient) { this.sleightOfHandProficient = sleightOfHandProficient; }
    public boolean isStealthProficient() { return stealthProficient; }
    public void setStealthProficient(boolean stealthProficient) { this.stealthProficient = stealthProficient; }
    public boolean isSurvivalProficient() { return survivalProficient; }
    public void setSurvivalProficient(boolean survivalProficient) { this.survivalProficient = survivalProficient; }

    // Геттеры и сеттеры для новых списков
    public List<Equipment> getEquipment() { return equipment; }
    public void setEquipment(List<Equipment> equipment) { this.equipment = equipment; }

    public List<Spell> getSpells() { return spells; }
    public void setSpells(List<Spell> spells) { this.spells = spells; }

    // Геттеры и сеттеры для координат на карте
    public int getMapX() { return mapX; }
    public void setMapX(int mapX) { this.mapX = mapX; }
    public int getMapY() { return mapY; }
    public void setMapY(int mapY) { this.mapY = mapY; }


    // --- Внутренние классы для снаряжения и заклинаний ---

    public static class Equipment {
        private String name;
        private String description;
        private int quantity;

        public Equipment() {} // Конструктор по умолчанию

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }

    public static class Spell {
        private String name;
        private String level; // Например, "Заговор", "1", "2"
        private String description; // Краткое описание или эффект

        public Spell() {} // Конструктор по умолчанию

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}