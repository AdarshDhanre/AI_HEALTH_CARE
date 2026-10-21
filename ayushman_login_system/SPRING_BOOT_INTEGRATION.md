# Spring Boot integration sketch

The Python service only extracts text. Keep registration, account linking, authentication and authorization in Spring Boot.

## Suggested sequence
1. Frontend uploads the card image to Spring Boot.
2. Spring Boot forwards it to the private Python service.
3. Python returns extracted text/field predictions.
4. Frontend displays fields for user correction.
5. Spring Boot requires an approved identity-verification step before linking the patient to an account.
6. Patient sets a password; store only a BCrypt/Argon2id hash.
7. Subsequent login uses the account's username/phone/email and password, with rate limiting and secure session handling.

## Example service (illustrative)
```java
@Service
public class CardOcrClient {
    private final WebClient client;

    public CardOcrClient(WebClient.Builder builder) {
        this.client = builder.baseUrl("http://127.0.0.1:8001").build();
    }

    public Mono<String> extract(MultipartFile image) {
        MultipartBodyBuilder body = new MultipartBodyBuilder();
        body.part("file", image.getResource())
            .contentType(MediaType.parseMediaType(
                image.getContentType() == null ? "application/octet-stream" : image.getContentType()
            ));
        return client.post()
            .uri("/extract")
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(BodyInserters.fromMultipartData(body.build()))
            .retrieve()
            .bodyToMono(String.class);
    }
}
```

Dependencies: `spring-boot-starter-webflux` for WebClient and `spring-boot-starter-web` for MVC upload controller.
Keep the Python service on a private network; never expose it directly to the public internet.

Do not create an endpoint that logs a person in solely because OCR found a matching name or card number. Use a verified identity/account-linking process. A photo can be copied or stolen.
