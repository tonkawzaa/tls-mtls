export type ConfigTab = 'SSL Bundle' | 'HTTP Client' | 'JVM Options' | 'Inbound HTTPS'
export function getCodeLines(code: string, tab: ConfigTab) {
  let group: 'key' | 'trust' | undefined
  const result: { text: string; number: number; group: 'key' | 'trust' | undefined }[] = []
  for (const [i, text] of code.split('\n').entries()) {
    if (/keystore:|keyStore|key-store/.test(text)) group = 'key'
    if (/truststore:|trustStore/.test(text)) group = 'trust'
    result.push({ text, number: i + 1, group: tab === 'HTTP Client' ? undefined : group })
  }
  return result
}
export const configuration: Record<ConfigTab, { file: string; code: string }> = {
  'SSL Bundle': {
    file: 'application.yml',
    code: `spring:
  ssl:
    bundle:
      jks:
        ecas:
          keystore:
            location: file:/config/oneapp-keystore.p12
            password: \u0024{ONEAPP_KEYSTORE_PASSWORD}
            type: PKCS12
          truststore:
            location: file:/config/oneapp-truststore.p12
            password: \u0024{ONEAPP_TRUSTSTORE_PASSWORD}
            type: PKCS12`,
  },
  'HTTP Client': {
    file: 'EcasClientConfiguration.java',
    code: `import org.springframework.boot.autoconfigure.web.client.RestClientSsl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class EcasClientConfiguration {
    @Bean
    RestClient ecasClient(RestClient.Builder builder,
                          RestClientSsl ssl) {
        return builder
            .baseUrl("https://ecas.example.internal")
            .apply(ssl.fromBundle("ecas"))
            .build();
    }
}`,
  },
  'JVM Options': {
    file: 'JSSE default SSLContext · JVM options',
    code: `-Djavax.net.ssl.keyStore=/config/oneapp-keystore.p12
-Djavax.net.ssl.keyStoreType=PKCS12
-Djavax.net.ssl.keyStorePassword=*****
-Djavax.net.ssl.trustStore=/config/oneapp-truststore.p12
-Djavax.net.ssl.trustStoreType=PKCS12
-Djavax.net.ssl.trustStorePassword=*****`,
  },
  'Inbound HTTPS': {
    file: 'OneApp HTTPS server · application.yml',
    code: `# HTTPS ขาเข้า OneApp — แยกจาก client ที่เรียก ECAS
server:
  port: 8443
  ssl:
    enabled: true
    key-store: file:/config/oneapp-server-keystore.p12
    key-store-password: \u0024{ONEAPP_SERVER_KEYSTORE_PASSWORD}
    key-store-type: PKCS12

# ต้องเป็น Server Authentication certificate
# ไม่ใช้ oneapp-client.crt แทน server identity
# server.ssl ไม่ได้ตั้งค่า outbound HTTP client`,
  },
}
