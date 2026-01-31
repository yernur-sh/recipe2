"use client";
import { useState } from "react";
import { kazakhRecipes } from "./data"; // Деректерді импорттау

export default function KazakhRecipesPage() {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState(kazakhRecipes);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);

  // Іздеу функциясы тек локалды массивпен жұмыс істейді
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setRecipes(kazakhRecipes);
      return;
    }
    const filtered = kazakhRecipes.filter((recipe) =>
      recipe.name.toLowerCase().includes(query.toLowerCase()) ||
      recipe.category.toLowerCase().includes(query.toLowerCase())
    );
    setRecipes(filtered);
  };

  return (
    <main className="min-h-screen bg-[#fffcf0] p-4 md:p-10 font-sans text-black">
      <div className="max-w-6xl mx-auto">
        {/* Артқа қайту батырмасы */}
        <div className="mb-4 md:mb-6">
          <a href="/" className="text-amber-800 font-bold flex items-center gap-2 hover:underline text-sm">
            ← Басты бетке қайту
          </a>
        </div>

        {/* Тақырып (Header) */}
        <header className="text-center mb-10 md:mb-16 pt-6 md:pt-10 px-2">
          <div className="relative inline-block max-w-full">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-light tracking-[0.15em] md:tracking-[0.3em] text-black uppercase leading-tight">
              Ulttyq Tagamdar
            </h1>
            <div className="h-[2px] md:h-[3px] w-full bg-black mt-2"></div>
          </div>
          <p className="mt-4 md:mt-6 text-[9px] md:text-[10px] tracking-[0.3em] md:tracking-[0.5em] text-amber-900 uppercase">
            Дәмді әрі құнарлы ата-баба асы
          </p>
        </header>

        {/* Іздеу формасы */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-10 md:mb-16 px-2">
          <input
            type="text"
            placeholder="Іздеу"
            className="w-full flex-1 p-4 md:p-5 rounded-2xl md:rounded-3xl border-2 text-black border-amber-100 focus:border-amber-600 outline-none shadow-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="w-full sm:w-auto bg-amber-800 text-white px-8 md:px-10 py-4 md:py-0 rounded-2xl md:rounded-3xl font-bold hover:bg-amber-900 transition-all shadow-md">
            Іздеу
          </button>
        </form>

        {/* Рецепттер тізімі (Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {recipes.map((recipe) => (
            <div 
              key={recipe.id} 
              onClick={() => setSelectedMeal(recipe)} 
              className="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-md border border-amber-50 cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <div className="w-full h-48 md:h-60 bg-amber-100 flex items-center justify-center overflow-hidden">
                {recipe.image ? (
                  <img src={recipe.image} className="w-full h-full object-cover" alt={recipe.name} />
                ) : (
                  <span className="text-amber-800 font-bold">{recipe.name}</span>
                )}
              </div>
              <div className="p-4 md:p-6 text-center">
                <h3 className="text-lg md:text-xl font-extrabold text-gray-800 leading-tight">{recipe.name}</h3>
                <p className="text-amber-700 font-bold text-[10px] md:text-sm mt-1 uppercase italic tracking-widest">
                   {recipe.category}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Модальді терезе (Мәліметтер) */}
        {selectedMeal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] max-w-4xl w-full p-6 md:p-12 relative shadow-2xl max-h-[95vh] overflow-y-auto">
              <button 
                onClick={() => setSelectedMeal(null)} 
                className="absolute top-4 right-6 text-2xl font-light hover:text-amber-600 transition-colors"
              >✕</button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div className="rounded-[1.5rem] md:rounded-[2rem] w-full h-48 sm:h-64 md:h-80 bg-amber-50 overflow-hidden shadow-inner">
                  {selectedMeal.image ? (
                    <img src={selectedMeal.image} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-amber-800 font-bold">{selectedMeal.name}</div>
                  )}
                </div>
                
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">{selectedMeal.name}</h2>
                  <h4 className="font-bold text-lg mb-2 border-l-4 border-amber-600 pl-2">Құрамы:</h4>
                  <ul className="text-sm space-y-1 bg-amber-50/30 p-4 rounded-xl">
                    {selectedMeal.ingredients.map((item: any, i: number) => (
                      <li key={i} className="flex justify-between border-b border-amber-100 py-1">
                        <span>• {item.ing}</span>
                        <span className="font-bold text-amber-800 text-xs">{item.measure}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 md:mt-8 bg-amber-50/20 p-4 md:p-6 rounded-2xl italic text-gray-700 text-sm md:text-base whitespace-pre-line border border-amber-100">
                <h4 className="text-amber-900 font-black mb-2 text-lg not-italic uppercase tracking-wider">Дайындалуы:</h4>
                {selectedMeal.instructions}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}