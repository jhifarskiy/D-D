package com.dnd.backend.controller;

import com.dnd.backend.model.Character;
import com.dnd.backend.repository.CharacterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

@RestController
@RequestMapping("/api/character")
@CrossOrigin(origins = "http://localhost:3000")
public class CharacterController {

    private static final Logger logger = LoggerFactory.getLogger(CharacterController.class);

    @Autowired
    private CharacterRepository characterRepository;

    @GetMapping
    public ResponseEntity<Character> getCharacter() {
        String fixedCharacterId = "60c72b2f9b1e8b0015b6d7a4";
        logger.info("Attempting to retrieve character with ID: {}", fixedCharacterId);
        Optional<Character> character = characterRepository.findById(fixedCharacterId);

        if (character.isPresent()) {
            logger.info("Character found: {}", character.get().getName());
            return ResponseEntity.ok(character.get());
        } else {
            logger.warn("Character with ID {} not found. Creating a new one with default values.", fixedCharacterId);
            Character newCharacter = new Character();
            newCharacter.setId(fixedCharacterId);
            // Остальные поля инициализируются в конструкторе Character
            try {
                characterRepository.save(newCharacter);
                logger.info("New character created and saved with ID: {}", newCharacter.getId());
                return ResponseEntity.ok(newCharacter);
            } catch (Exception e) {
                logger.error("Error saving new character: {}", e.getMessage(), e);
                return ResponseEntity.status(500).build();
            }
        }
    }

    @PostMapping
    public ResponseEntity<String> saveCharacter(@RequestBody Character characterUpdate) {
        String fixedCharacterId = "60c72b2f9b1e8b0015b6d7a4";
        logger.info("Received request to save character with ID: {}", fixedCharacterId);

        Optional<Character> existingCharacterOptional = characterRepository.findById(fixedCharacterId);
        Character characterToSave;

        if (existingCharacterOptional.isPresent()) {
            characterToSave = existingCharacterOptional.get();
            // Обновляем все поля, которые могли быть изменены
            characterToSave.setName(characterUpdate.getName());
            characterToSave.setStrength(characterUpdate.getStrength());
            characterToSave.setDexterity(characterUpdate.getDexterity());
            characterToSave.setConstitution(characterUpdate.getConstitution());
            characterToSave.setIntell(characterUpdate.getIntell());
            characterToSave.setWisdom(characterUpdate.getWisdom());
            characterToSave.setCharisma(characterUpdate.getCharisma());

            characterToSave.setProficiencyBonus(characterUpdate.getProficiencyBonus());
            characterToSave.setStrengthSaveProficient(characterUpdate.isStrengthSaveProficient());
            characterToSave.setDexteritySaveProficient(characterUpdate.isDexteritySaveProficient());
            characterToSave.setConstitutionSaveProficient(characterUpdate.isConstitutionSaveProficient());
            characterToSave.setIntellSaveProficient(characterUpdate.isIntellSaveProficient());
            characterToSave.setWisdomSaveProficient(characterUpdate.isWisdomSaveProficient());
            characterToSave.setCharismaSaveProficient(characterUpdate.isCharismaSaveProficient());

            characterToSave.setAcrobaticsProficient(characterUpdate.isAcrobaticsProficient());
            characterToSave.setAnimalHandlingProficient(characterUpdate.isAnimalHandlingProficient());
            characterToSave.setArcanaProficient(characterUpdate.isArcanaProficient());
            characterToSave.setAthleticsProficient(characterUpdate.isAthleticsProficient());
            characterToSave.setDeceptionProficient(characterUpdate.isDeceptionProficient());
            characterToSave.setHistoryProficient(characterUpdate.isHistoryProficient());
            characterToSave.setInsightProficient(characterUpdate.isInsightProficient());
            characterToSave.setIntimidationProficient(characterUpdate.isIntimidationProficient());
            characterToSave.setInvestigationProficient(characterUpdate.isInvestigationProficient());
            characterToSave.setMedicineProficient(characterUpdate.isMedicineProficient());
            characterToSave.setNatureProficient(characterUpdate.isNatureProficient());
            characterToSave.setPerceptionProficient(characterUpdate.isPerceptionProficient());
            characterToSave.setPerformanceProficient(characterUpdate.isPerformanceProficient());
            characterToSave.setPersuasionProficient(characterUpdate.isPersuasionProficient());
            characterToSave.setReligionProficient(characterUpdate.isReligionProficient());
            characterToSave.setSleightOfHandProficient(characterUpdate.isSleightOfHandProficient());
            characterToSave.setStealthProficient(characterUpdate.isStealthProficient());
            characterToSave.setSurvivalProficient(characterUpdate.isSurvivalProficient());

            // Обновление списков снаряжения и заклинаний
            characterToSave.setEquipment(characterUpdate.getEquipment());
            characterToSave.setSpells(characterUpdate.getSpells());

            // Обновление координат на карте
            characterToSave.setMapX(characterUpdate.getMapX());
            characterToSave.setMapY(characterUpdate.getMapY());

            logger.info("Updating existing character from '{}' to '{}'", existingCharacterOptional.get().getName(), characterToSave.getName());
        } else {
            characterToSave = characterUpdate;
            characterToSave.setId(fixedCharacterId);
            logger.info("Creating new character with ID: {} and name: {}", fixedCharacterId, characterUpdate.getName());
        }

        try {
            characterRepository.save(characterToSave);
            logger.info("Character '{}' saved successfully to MongoDB.", characterToSave.getName());
            return ResponseEntity.ok("Character saved successfully!");
        } catch (Exception e) {
            logger.error("Error saving character '{}': {}", characterToSave.getName(), e.getMessage(), e);
            return ResponseEntity.status(500).body("Error saving character: " + e.getMessage());
        }
    }
}