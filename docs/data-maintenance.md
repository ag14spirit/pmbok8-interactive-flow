# Manutenção dos dados do A0

Esta página é destinada a quem mantém o conteúdo do projeto. **Não é necessário seguir estes passos para instalar ou usar o app.** A aplicação lê os dados estáticos de `data/processes.json`.

## Quando usar

Use os scripts apenas se o PDF-fonte A0 mudar e for necessário extrair novamente os processos ou recalcular as conexões inferidas.

## Extrair os processos do PDF

Execute os comandos a partir da raiz do projeto. O extrator usa PyMuPDF e recebe o caminho do PDF A0 em português:

```sh
python -m pip install pymupdf
python scripts/extract_a0.py "<caminho-para-o-PDF-A0>"
```

Se o comando `python` não apontar para Python 3, use o nome do executável Python 3 disponível no sistema.

Por padrão, o resultado é escrito em `data/processes.generated.json`, sem substituir `data/processes.json`. O arquivo gerado mantém os metadados do dataset-base, reaplica as normalizações dos cartões 2.4, 4.2 e 6.5, preserva `a0Connectors` e recalcula as conexões inferidas. O dataset-base precisa conter `a0Connectors`; se não contiver, o script interrompe antes de gravar.

Revise o arquivo gerado antes de usá-lo como dataset principal. A extração depende da estrutura visual e textual do PDF e deve ser conferida quando a fonte mudar.

## Recalcular conexões inferidas

Para gerar uma cópia revisada sem alterar o dataset principal:

```sh
python scripts/build_edges.py data/processes.json data/processes.generated.json
```

Quando a entrada é um dataset completo, o script substitui somente `edges` e preserva as outras chaves, inclusive `a0Connectors`. Sem um destino explícito, ele atualiza o próprio arquivo de entrada. Uma lista isolada de processos não pode ser sobrescrita sem informar um arquivo de saída.

O dataset atual contém 40 processos, 38 conectores explícitos do A0 e 203 conexões inferidas. Esses números servem como referência para a versão atual; podem mudar se a fonte for atualizada.
