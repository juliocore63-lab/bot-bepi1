// ==========================================
// CORREGEDORIA PMCE - GERADOR DE PDF
// Central Operacional PMCE
// ==========================================


const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");



// Caminhos
const pastaRelatorios = path.join(
    __dirname,
    "../relatorios"
);


const caminhoBrasao = path.join(
    __dirname,
    "../assets/pmce.png"
);




// Criar pasta de relatórios
function criarPastaRelatorios(){

    if(!fs.existsSync(pastaRelatorios)){

        fs.mkdirSync(
            pastaRelatorios,
            {
                recursive:true
            }
        );

    }

}




// Nome do arquivo
function gerarNomeArquivo(processo){

    return `Processo_${processo.codigo || Date.now()}.pdf`;

}




// Cabeçalho
function adicionarCabecalho(doc){


    doc.fontSize(10)
        .text(
            "POLÍCIA MILITAR DO CEARÁ",
            {
                align:"center"
            }
        );


    doc.fontSize(9)
        .text(
            "CORREGEDORIA",
            {
                align:"center"
            }
        );


    doc.moveDown(2);

}




// Capa
function criarCapa(doc, processo){



    if(fs.existsSync(caminhoBrasao)){


        doc.image(
            caminhoBrasao,
            {
                fit:[120,120],
                align:"center"
            }
        );


    }



    doc.moveDown(3);



    doc.fontSize(20)
        .text(
            "POLÍCIA MILITAR DO CEARÁ",
            {
                align:"center"
            }
        );



    doc.moveDown();



    doc.fontSize(18)
        .text(
            "CORREGEDORIA",
            {
                align:"center"
            }
        );



    doc.moveDown(2);



    doc.fontSize(14)
        .text(
            "PROCESSO DISCIPLINAR",
            {
                align:"center",
                underline:true
            }
        );



    doc.moveDown(2);



    doc.fontSize(12)
        .text(
            `Processo: ${processo.numero || "N/A"}`,
            {
                align:"center"
            }
        );


    doc.text(
        `Código: ${processo.codigo || "N/A"}`,
        {
            align:"center"
        }
    );


    doc.moveDown(2);



    doc.text(
        `Data de abertura: ${
            processo.data ||
            new Date().toLocaleDateString("pt-BR")
        }`,
        {
            align:"center"
        }
    );



    doc.addPage();


}





// Dados do processo
function adicionarDados(doc, processo, investigado, responsavel){


    doc.fontSize(14)
        .text(
            "Dados do Processo",
            {
                underline:true
            }
        );


    doc.moveDown();



    doc.fontSize(11)
        .text(
`
Número:
${processo.numero || "Não informado"}

Código:
${processo.codigo || "Não informado"}

Situação:
${processo.situacao || "Em análise"}

Investigado:
${investigado?.username || "Não informado"}

Responsável:
${responsavel?.username || "Não informado"}

Tipo:
${processo.tipo || "Não informado"}

Motivo:
${processo.motivo || "Não informado"}

Observações:
${processo.observacoes || "Nenhuma"}
`
        );


    doc.moveDown(2);

}





// Envolvidos
function adicionarEnvolvidos(doc, processo, investigado){


    doc.fontSize(14)
        .text(
            "Envolvidos",
            {
                underline:true
            }
        );


    doc.moveDown();



    doc.fontSize(11)
        .text(
`Investigado:

${investigado?.username || "Não informado"}`
        );


    doc.moveDown(2);

}





// Testemunhas
async function adicionarTestemunhas(doc, processo, client) {

    doc.fontSize(14)
        .text("Testemunhas", {
            underline: true
        });

    doc.moveDown();

    if (!processo.testemunhas || processo.testemunhas.length === 0) {

        doc.fontSize(11)
            .text("Nenhuma testemunha cadastrada.");

        doc.moveDown(2);
        return;
    }

    for (let i = 0; i < processo.testemunhas.length; i++) {

        const t = processo.testemunhas[i];

        const usuario = await client.users
            .fetch(t.testemunhaId)
            .catch(() => null);

        const registrador = await client.users
            .fetch(t.registradoPorId)
            .catch(() => null);

        doc.fontSize(12)
            .text(`${i + 1}ª Testemunha`, {
                underline: true
            });

        doc.fontSize(11);
        doc.text(`Nome: ${usuario ? usuario.username : t.testemunhaId}`);
        doc.text(`Data: ${t.data}`);
        doc.text(`Horário: ${t.horario}`);
        doc.text(`Resumo: ${t.resumo}`);
        doc.text(`Observações: ${t.observacoes || "Nenhuma"}`);
        doc.text(
            `Registrado por: ${registrador ? registrador.username : t.registradoPorId}`
        );

        doc.moveDown();
    }

    doc.moveDown();
}





// Descrição
function adicionarDescricao(doc, processo){



    doc.fontSize(14)
        .text(
            "Descrição da Ocorrência",
            {
                underline:true
            }
        );



    doc.moveDown();



    doc.fontSize(11)
        .text(
            processo.descricao ||
            "Sem descrição.",
            {
                align:"justify"
            }
        );


    doc.moveDown(2);

}





// Histórico
function adicionarHistorico(doc, processo){



    doc.fontSize(14)
        .text(
            "Histórico",
            {
                underline:true
            }
        );



    doc.moveDown();



    if(
        !processo.historico ||
        processo.historico.length === 0
    ){


        doc.fontSize(11)
            .text(
                "Nenhuma movimentação registrada."
            );


        return;

    }



    processo.historico.forEach(
        (item,index)=>{


            doc.fontSize(11)
                .text(
`${index+1} - ${item.acao || ""}

Usuário:
${item.usuario || ""}

Data:
${item.data || ""}`
                );


            doc.moveDown();


        }
    );



}




// Encerramento
function adicionarEncerramento(doc, processo){



    doc.addPage();



    doc.fontSize(14)
        .text(
            "Encerramento",
            {
                underline:true
            }
        );



    doc.moveDown();



    doc.fontSize(11)
        .text(
`
Situação final:
${processo.situacao || "Não definida"}


Data:
${new Date().toLocaleDateString("pt-BR")}
`
        );



    doc.moveDown(4);



    doc.text(
        "________________________________",
        {
            align:"center"
        }
    );


    doc.text(
        "Responsável pela Corregedoria",
        {
            align:"center"
        }
    );


}





// Rodapé
function adicionarRodape(doc){



    doc.fontSize(9)
        .text(
            "Central Operacional PMCE - Sistema Corregedoria",
            50,
            780,
            {
                align:"center"
            }
        );


}




// ==========================================
// FUNÇÃO PRINCIPAL
// ==========================================

async function gerarPDFRelatorio(processo, client){

    const investigado = await client.users.fetch(
    processo.investigadoId
).catch(() => null);


const responsavel = await client.users.fetch(
    processo.responsavelId
).catch(() => null);



    criarPastaRelatorios();



    const arquivo = path.join(
        pastaRelatorios,
        gerarNomeArquivo(processo)
    );



    const doc = new PDFDocument({
        size:"A4",
        margin:50
    });



    const stream = fs.createWriteStream(
        arquivo
    );



    doc.pipe(stream);



    criarCapa(
        doc,
        processo
    );


    adicionarCabecalho(doc);


    adicionarDados(
    doc,
    processo,
    investigado,
    responsavel
);


    adicionarEnvolvidos(
    doc,
    processo,
    investigado
);


    await adicionarTestemunhas(
    doc,
    processo,
    client
);


    adicionarDescricao(
        doc,
        processo
    );


    adicionarHistorico(
        doc,
        processo
    );


    adicionarEncerramento(
        doc,
        processo
    );


    adicionarRodape(doc);



    doc.end();



    await new Promise(resolve=>{

        stream.on(
            "finish",
            resolve
        );

    });



    return arquivo;


}





module.exports = {
    gerarPDFRelatorio
};