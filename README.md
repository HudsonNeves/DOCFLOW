# DOCFLOW — Gestão Inteligente de Documentos

Protótipo de interface web responsiva para gestão documental, construído com HTML5, CSS3 (Flexbox) e JavaScript puro.

## Estrutura

```text
docflow/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── README.md
```

## Como executar

1. Extraia o arquivo ZIP.
2. Abra a pasta `docflow`.
3. Dê duplo clique em `index.html` ou abra-o em um navegador moderno.

Não é necessário instalar dependências ou executar servidor.

## Funcionalidades

- Navegação entre módulos.
- Dashboard com indicadores e gráficos ilustrativos.
- Listagem de documentos.
- Pesquisa e filtros por categoria e status.
- Cadastro de documentos com armazenamento local de dados e nome do arquivo.
- Categorias.
- Aprovação e reprovação de itens.
- Agenda de vencimentos.
- Assistente com respostas simuladas.
- Preferências salvas localmente.
- Layout responsivo para desktop e celular.

## Tecnologias

- HTML5 semântico
- CSS3 com Flexbox
- JavaScript (Vanilla)

## Limitações da versão frontend

Esta versão funciona somente no navegador e não depende de backend. Documentos cadastrados, aprovações e preferências são armazenados no armazenamento local do navegador e ficam disponíveis apenas nesse navegador e dispositivo. O upload não envia nem salva o conteúdo dos arquivos: somente os dados do cadastro e o nome do arquivo selecionado são armazenados. Limpar os dados do navegador remove esses registros.

Autenticação, compartilhamento entre usuários ou dispositivos, armazenamento seguro de arquivos e integração real com IA exigem backend e serão tratados em uma etapa futura. O assistente e alguns indicadores são demonstrativos.
