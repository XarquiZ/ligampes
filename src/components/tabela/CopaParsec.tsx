export default function CopaParsec() {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-yellow-500/20">
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-black">CP</span>
            </div>
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">
              Copa Parsec
            </h2>
            <p className="text-gray-400">
              Torneio que reúne os melhores times das Séries A e B
            </p>
          </div>
          
          <div className="max-w-md mx-auto bg-gray-900/50 rounded-lg p-6 border border-yellow-500/30">
            <div className="flex items-center justify-center gap-3 text-yellow-300 mb-4">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <p className="text-lg font-semibold">Em Breve</p>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-gray-300">
              A Copa Parsec está em fase de preparação. Em breve teremos mais informações sobre o formato, participantes e calendário do torneio.
            </p>
          </div>
        </div>
      </div>
    );
  }