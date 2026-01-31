"use client";
import { useState, useEffect } from "react";
import { foodGlossary } from "./glossary";
import Link from "next/link"; 

export default function RecipeApp() {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // --- Функционалдық бөлім өзгеріссіз қалады ---
  const applyGlossary = (text: string) => {
    if (!text) return text;
    let processedText = text;
    const sortedKeys = Object.keys(foodGlossary).sort((a, b) => b.length - a.length);
    sortedKeys.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (processedText.toLowerCase().includes(word)) {
        processedText = processedText.replace(regex, foodGlossary[word]);
      }
    });
    return processedText;
  };

  const translateWithGlossary = async (text: string, sl = "en", tl = "kk") => {
    if (!text || text.trim() === "") return text;
    const lowerText = text.toLowerCase().trim();
    if (foodGlossary[lowerText]) return foodGlossary[lowerText];
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      let translated = data[0].map((item: any) => item[0]).join("");
      return applyGlossary(translated);
    } catch (error) { return text; }
  };

  const translateMeals = async (meals: any[]) => {
    if (!meals) return [];
    return await Promise.all(meals.map(async (meal) => ({
      ...meal,
      strMealKaz: await translateWithGlossary(meal.strMeal),
      strAreaKaz: await translateWithGlossary(meal.strArea)
    })));
  };

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=a`);
      const data = await res.json();
      const translated = await translateMeals(data.meals);
      setRecipes(translated);
      setLoading(false);
    };
    loadInitial();
  }, []);

  const searchRecipes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    const enQuery = await translateWithGlossary(query, "kk", "en");
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${enQuery}`);
    const data = await res.json();
    const translated = await translateMeals(data.meals);
    setRecipes(translated);
    setLoading(false);
  };

  const openRecipe = async (meal: any) => {
    setLoading(true);
    const rawIngredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ing && ing.trim() !== "") rawIngredients.push({ origIng: ing, origMeasure: measure });
    }
    const [translatedInstructions, translatedCategory] = await Promise.all([
      translateWithGlossary(meal.strInstructions),
      translateWithGlossary(meal.strCategory)
    ]);
    const formattedInstructions = translatedInstructions.replace(/қадам\s*(\d+)/gi, "$1-ші қадам").replace(/Step\s*(\d+)/gi, "$1-ші қадам");
    const ingredientsKaz = await Promise.all(rawIngredients.map(async (item) => ({
      ing: applyGlossary(await translateWithGlossary(item.origIng)),
      measure: applyGlossary(await translateWithGlossary(item.origMeasure))
    })));
    setSelectedMeal({
      ...meal,
      strMealKaz: await translateWithGlossary(meal.strMeal),
      strAreaKaz: await translateWithGlossary(meal.strArea),
      strInstructionsKaz: formattedInstructions,
      strCategoryKaz: translatedCategory,
      ingredientsKaz: ingredientsKaz
    });
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#fffcf7] p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10 md:mb-16 pt-6 md:pt-10 px-2">
          <div className="relative inline-block max-w-full">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-light tracking-[0.15em] md:tracking-[0.3em] text-black uppercase leading-tight">
              Damdy Tagamdar
            </h1>
            <div className="h-[2px] md:h-[3px] w-full bg-black mt-2"></div>
          </div>

          <div className="mt-8 md:mt-10">
            <Link 
              href="/pp-recipes" 
              className="text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.4em] uppercase text-gray-700 hover:text-black transition-colors border-b border-transparent hover:border-black pb-1"
            >
              Пайдалы тағамдар бөліміне өту →
            </Link>
          </div>
          <div className="mt-4">
            <Link 
              href="/kazakh-recipes" 
              className="text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.4em] uppercase text-gray-700 hover:text-black transition-colors border-b border-transparent hover:border-black pb-1"
                  >
              Қазақтың ұлттық тағамдары →
  </Link>
</div>
        </header>

        <form onSubmit={searchRecipes} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-10 md:mb-16 px-2">
          <input
            type="text"
            placeholder="Тағам атын жазыңыз..."
            className="w-full flex-1 p-4 md:p-5 rounded-2xl md:rounded-3xl border-2 text-black border-orange-100 focus:border-orange-500 outline-none shadow-md transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="w-full sm:w-auto bg-orange-500 text-white px-8 md:px-10 py-4 md:py-0 rounded-2xl md:rounded-3xl font-bold hover:bg-orange-600 transition-all shadow-md">
            Іздеу
          </button>
        </form>

        {loading && (
          <div className="text-center py-10 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-orange-500"></div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {recipes.map((meal: any) => (
            <div 
              key={meal.idMeal} 
              onClick={() => openRecipe(meal)} 
              className="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-xl hover:scale-105 transition-all cursor-pointer border border-orange-50"
            >
              <img src={meal.strMealThumb} className="w-full h-48 md:h-60 object-cover" alt="" />
              <div className="p-4 md:p-6 text-center sm:text-left">
                <h3 className="text-lg md:text-xl font-extrabold text-gray-800 leading-tight">{meal.strMealKaz || meal.strMeal}</h3>
                <p className="text-orange-500 font-bold text-[10px] md:text-sm mt-1 uppercase italic">
                  {meal.strAreaKaz || meal.strArea}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Модальды терезе бейімделген */}
        {selectedMeal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] max-w-4xl w-full p-6 md:p-12 relative shadow-2xl overflow-y-auto max-h-[95vh]">
              <button onClick={() => setSelectedMeal(null)} className="absolute top-4 right-6 text-2xl md:text-3xl font-light text-black">✕</button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 border-b border-gray-700 pb-6 md:pb-10">
                <img src={selectedMeal.strMealThumb} className="w-full h-48 sm:h-64 md:h-[350px] object-cover rounded-[1.5rem] md:rounded-[2rem] shadow-lg" alt="" />
                <div>
                  <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-4">{selectedMeal.strMealKaz}</h2>
                  <h4 className="font-bold text-lg text-black md:text-xl mb-4 border-l-4 border-orange-500 pl-3">Ингредиенттер:</h4>
                  <ul className="text-sm md:text-md space-y-2 bg-gray-50 p-4 rounded-xl max-h-48 overflow-y-auto">
                    {selectedMeal.ingredientsKaz?.map((item: any, i: number) => (
                      <li key={i} className="flex justify-between border-b border-gray-700 py-1 text-black">
                        <span>• {item.ing}</span>
                        <span className="font-bold text-orange-600 text-xs">{item.measure}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 md:mt-10">
                <h4 className="font-bold text-xl md:text-2xl text-orange-600 mb-4">Дайындалу жолы:</h4>
                <div className="text-gray-800 leading-relaxed text-sm md:text-lg bg-[#fff9f0] p-4 md:p-8 rounded-[1.5rem] whitespace-pre-line">
                  {selectedMeal.strInstructionsKaz}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}