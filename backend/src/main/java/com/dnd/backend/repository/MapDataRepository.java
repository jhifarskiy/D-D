package com.dnd.backend.repository;

import com.dnd.backend.model.MapData;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MapDataRepository extends MongoRepository<MapData, String> {
    // Spring Data MongoDB автоматически предоставит базовые CRUD операции
}