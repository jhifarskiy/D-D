package com.dnd.backend.repository;

import com.dnd.backend.model.Character;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CharacterRepository extends MongoRepository<Character, String> {
    // Дополнительные методы для поиска персонажей, если понадобятся
    // Например: Character findByName(String name);
}