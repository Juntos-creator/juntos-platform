@echo off
keytool -genkeypair -v -keystore android\app\juntos-release-key.jks -alias juntos-key-alias -keyalg RSA -keysize 2048 -validity 10000 -storepass MiClaveSegura2026! -keypass MiClaveSegura2026! -dname "CN=JUNTOS Asistencia RD, OU=Operaciones, O=JUNTOS Asistencia SRL, L=Santo Domingo, ST=Distrito Nacional, C=DO"

