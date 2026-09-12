# Bíblia Sagrada & Devocional Lite — projeto final

Projeto mobile pronto para ser enviado ao GitHub e gerar APK pelo GitHub Actions, sem Android Studio.

## O que está incluído
- 365 Palavras do Dia (uma por data de 2026)
- 365 devocionais relacionados ao tema
- 365 pregações originais relacionadas ao tema, estruturadas para leitura longa e voz do aparelho
- cronômetro real de 30 minutos
- leitura por voz com divisão em trechos para não depender de uma única fala gigantesca
- favoritos e última leitura salvos no aparelho
- central de notificações e notificação diária às 08:00 no APK
- Bíblia preparada para ficar offline no APK
- busca local no banco bíblico
- interface sem rolagem na tela principal
- ícone incluído

## Gerar o APK
1. Crie um repositório vazio no GitHub.
2. Extraia este ZIP na raiz do repositório.
3. Envie os arquivos para a branch `main`.
4. Abra **Actions → Build APK → Run workflow**.
5. Ao terminar, abra o artefato **Biblia-Sagrada-Devocional-Lite-APK** e baixe o APK.

A internet é necessária apenas durante a compilação para baixar dependências e o banco bíblico. Depois de instalado, a Bíblia e o conteúdo diário ficam dentro do aplicativo.

## Observação sobre a Bíblia
O workflow baixa um banco público do projeto bible-data para incorporá-lo no APK. A tradução/banco efetivamente usado deve ser conferido/licenciado conforme a fonte antes de uma publicação comercial.
