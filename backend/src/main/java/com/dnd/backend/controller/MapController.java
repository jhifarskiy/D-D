package com.dnd.backend.controller;

import com.dnd.backend.model.MapData;
import com.dnd.backend.repository.MapDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/map")
@CrossOrigin(origins = "http://localhost:3000")
public class MapController {

    private static final Logger logger = LoggerFactory.getLogger(MapController.class);
    private static final String FIXED_MAP_ID = "main_map"; // Фиксированный ID для главной карты

    @Autowired
    private MapDataRepository mapDataRepository;

    @GetMapping
    public ResponseEntity<MapData> getMapData() {
        logger.info("Attempting to retrieve map data with ID: {}", FIXED_MAP_ID);
        // Пытаемся найти карту по фиксированному ID
        return mapDataRepository.findById(FIXED_MAP_ID)
                .map(mapData -> {
                    logger.info("Map data found for ID: {}", FIXED_MAP_ID);
                    return ResponseEntity.ok(mapData);
                })
                .orElseGet(() -> {
                    // Если карта не найдена, создаем новую с дефолтными значениями и сохраняем
                    logger.warn("Map data with ID {} not found. Creating a new one with default values.", FIXED_MAP_ID);
                    MapData newMap = new MapData();
                    newMap.setId(FIXED_MAP_ID);
                    try {
                        mapDataRepository.save(newMap);
                        logger.info("New map data created and saved with ID: {}", newMap.getId());
                        return ResponseEntity.ok(newMap);
                    } catch (Exception e) {
                        logger.error("Error saving new map data: {}", e.getMessage(), e);
                        return ResponseEntity.status(500).build();
                    }
                });
    }

    @PostMapping
    public ResponseEntity<String> saveMapData(@RequestBody MapData mapUpdate) {
        logger.info("Received request to save map data with ID: {}", FIXED_MAP_ID);

        // Убедимся, что сохраняем данные для фиксированного ID
        mapUpdate.setId(FIXED_MAP_ID);

        try {
            mapDataRepository.save(mapUpdate);
            logger.info("Map data with ID '{}' saved successfully to MongoDB.", FIXED_MAP_ID);
            return ResponseEntity.ok("Map data saved successfully!");
        } catch (Exception e) {
            logger.error("Error saving map data with ID '{}': {}", FIXED_MAP_ID, e.getMessage(), e);
            return ResponseEntity.status(500).body("Error saving map data: " + e.getMessage());
        }
    }
}