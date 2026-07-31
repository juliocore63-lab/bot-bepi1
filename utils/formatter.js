function formatMinutes(min) {
  const horas = Math.floor(min / 60);
  const minutos = Math.floor(min % 60);

  return `${horas.toString().padStart(2, "0")}h ${minutos
    .toString()
    .padStart(2, "0")}min`;
}

function formatTempoIndividual(viatura, equipeFinal) {
  if (!equipeFinal.length) {
    return "Nenhum tempo registrado.";
  }

  return equipeFinal
    .map((membroId, index) => {
      const tempo = viatura.tempoIndividual?.[membroId] || 0;
      return `P${index + 1}: <@${membroId}> — ${tempo.toFixed(1)} min`;
    })
    .join("\n");
}

module.exports = {
  formatMinutes,
  formatTempoIndividual,
};