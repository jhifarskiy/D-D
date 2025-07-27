package com.dnd.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
// import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@SpringBootApplication
@EnableWebSocketMessageBroker // Включаем поддержку WebSocket-брокера сообщений
public class BackendApplication implements WebSocketMessageBrokerConfigurer {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry config) {
		// Включаем простой брокер сообщений, который будет пересылать сообщения,
		// адресованные на префикс "/topic"
		config.enableSimpleBroker("/topic");
		// Определяем префикс для сообщений, которые клиент будет отправлять на сервер
		// (например, "/app/move" будет маршрутизироваться в @MessageMapping)
		config.setApplicationDestinationPrefixes("/app");
	}

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		// Регистрируем эндпоинт "/ws" для WebSocket-соединений.
		// Клиенты будут подключаться к "ws://localhost:8080/ws".
		// .withSockJS() добавляет поддержку SockJS для браузеров, которые не поддерживают WebSockets
		registry.addEndpoint("/ws").setAllowedOrigins("http://localhost:3000").withSockJS();
	}
}