package com.dnd.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "maps")
public class MapData {
    @Id
    private String id; // Уникальный идентификатор карты (можно сделать фиксированным для простоты, например, "main_map")
    private int gridSize;
    private String backgroundUrl;
    private List<MapCharacter> characters = new ArrayList<>(); // Список персонажей на карте

    public MapData() {
        this.gridSize = 50; // Значение по умолчанию
        this.backgroundUrl = ""; // Пустой URL по умолчанию
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public int getGridSize() {
        return gridSize;
    }

    public void setGridSize(int gridSize) {
        this.gridSize = gridSize;
    }

    public String getBackgroundUrl() {
        return backgroundUrl;
    }

    public void setBackgroundUrl(String backgroundUrl) {
        this.backgroundUrl = backgroundUrl;
    }

    public List<MapCharacter> getCharacters() {
        return characters;
    }

    public void setCharacters(List<MapCharacter> characters) {
        this.characters = characters;
    }

    // Внутренний класс для представления персонажей на карте
    public static class MapCharacter {
        private String characterId; // ID персонажа из коллекции characters
        private String name; // Имя персонажа для отображения на карте
        private int x; // Позиция по X на карте
        private int y; // Позиция по Y на карте
        private String color; // Цвет маркера персонажа

        public MapCharacter() {}

        public MapCharacter(String characterId, String name, int x, int y, String color) {
            this.characterId = characterId;
            this.name = name;
            this.x = x;
            this.y = y;
            this.color = color;
        }

        public String getCharacterId() {
            return characterId;
        }

        public void setCharacterId(String characterId) {
            this.characterId = characterId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getX() {
            return x;
        }

        public void setX(int x) {
            this.x = x;
        }

        public int getY() {
            return y;
        }

        public void setY(int y) {
            this.y = y;
        }

        public String getColor() {
            return color;
        }

        public void setColor(String color) {
            this.color = color;
        }
    }
}