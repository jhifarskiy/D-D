package com.dnd.backend.controller;

import com.dnd.backend.model.Character;
import com.dnd.backend.repository.CharacterRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Optional;

@Controller
public class MapWebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(MapWebSocketController.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate; // Для отправки сообщений по WebSocket

    @Autowired
    private CharacterRepository characterRepository;

    // Метод для обработки сообщений о перемещении персонажа
    // Клиент будет отправлять сообщения на "/app/map.moveCharacter"
    @MessageMapping("/map.moveCharacter")
    public void moveCharacter(Character characterUpdate) {
        logger.info("Received character move update via WebSocket for ID: {}, X: {}, Y: {}",
                characterUpdate.getId(), characterUpdate.getMapX(), characterUpdate.getMapY());

        Optional<Character> existingCharacterOptional = characterRepository.findById(characterUpdate.getId());

        if (existingCharacterOptional.isPresent()) {
            Character existingCharacter = existingCharacterOptional.get();
            // Обновляем только координаты персонажа
            existingCharacter.setMapX(characterUpdate.getMapX());
            existingCharacter.setMapY(characterUpdate.getMapY());

            try {
                characterRepository.save(existingCharacter);
                logger.debug("Character {} position updated in DB.", existingCharacter.getId());

                // Отправляем обновленные данные персонажа всем подписчикам на "/topic/map.characterMoved"
                messagingTemplate.convertAndSend("/topic/map.characterMoved", existingCharacter);
                logger.info("Published character move update to /topic/map.characterMoved for ID: {}", existingCharacter.getId());
            } catch (Exception e) {
                logger.error("Error saving character position update via WebSocket: {}", e.getMessage(), e);
            }
        } else {
            logger.warn("Character with ID {} not found for WebSocket move update.", characterUpdate.getId());
        }
    }
    
    // В будущем здесь будут другие методы для синхронизации карты, других персонажей и т.д.
    // Например, для добавления новых персонажей на карту, удаления, обновления фона и т.д.
}