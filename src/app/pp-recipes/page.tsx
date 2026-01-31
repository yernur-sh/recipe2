"use client";
import { useState, useEffect } from "react";
import { foodGlossary } from "../glossary";

export default function PPRecipesPage() {
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

  const loadPPInitial = async () => {
    setLoading(true);
    try {
      const categories = ['Vegetarian', 'Seafood', 'Vegan'];
      const allMealsRequests = categories.map(cat => 
        fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${cat}`).then(r => r.json())
      );
      const results = await Promise.all(allMealsRequests);
      const combinedMeals = results.flatMap(res => res.meals || []).slice(0, 24);

      const mealDetails = await Promise.all(
        combinedMeals.map(async (m: any) => {
          const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`);
          const detailData = await detailRes.json();
          return detailData.meals[0];
        })
      );
      const translated = await translateMeals(mealDetails);
      setRecipes(translated);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadPPInitial(); }, []);

  const searchPPRecipes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) { loadPPInitial(); return; }
    setLoading(true);
    try {
      const enQuery = await translateWithGlossary(query, "kk", "en");
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${enQuery}`);
      const data = await res.json();
      if (data.meals) {
        const healthyMeals = data.meals.filter((m: any) => 
          ['Vegetarian', 'Seafood', 'Vegan', 'Side', 'Dessert'].includes(m.strCategory)
        );
        const translated = await translateMeals(healthyMeals.length > 0 ? healthyMeals : data.meals);
        setRecipes(translated);
      } else { setRecipes([]); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openRecipe = async (meal: any) => {
    setLoading(true);
    const rawIngredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ing && ing.trim() !== "") rawIngredients.push({ ing, measure });
    }
    const [transInstr, transCat] = await Promise.all([
      translateWithGlossary(meal.strInstructions),
      translateWithGlossary(meal.strCategory)
    ]);
    const ingredientsKaz = await Promise.all(rawIngredients.map(async (item) => ({
      ing: applyGlossary(await translateWithGlossary(item.ing)),
      measure: applyGlossary(await translateWithGlossary(item.measure))
    })));
    setSelectedMeal({
      ...meal,
      strMealKaz: await translateWithGlossary(meal.strMeal),
      strAreaKaz: await translateWithGlossary(meal.strArea),
      strInstructionsKaz: transInstr,
      strCategoryKaz: transCat,
      ingredientsKaz: ingredientsKaz
    });
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#f4faf4] p-4 md:p-10 font-sans text-black">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 md:mb-6">
          <a href="/" className="text-green-600 font-bold flex items-center gap-2 hover:underline text-sm">
            ← Басты бет
          </a>
        </div>

        <header className="text-center mb-10 md:mb-16 pt-6 md:pt-10 px-2">
          <div className="relative inline-block max-w-full">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-light tracking-[0.15em] md:tracking-[0.3em] text-black uppercase leading-tight">
              Paidaly Tagamdar
            </h1>
            <div className="h-[2px] md:h-[3px] w-full bg-black mt-2"></div>
          </div>
          <p className="mt-4 md:mt-6 text-[9px] md:text-[10px] tracking-[0.3em] md:tracking-[0.5em] text-gray-700 uppercase">
            Дұрыс тамақтану — денсаулық кепілі
          </p>
        </header>

        <form onSubmit={searchPPRecipes} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-10 md:mb-16 px-2">
          <input
            type="text"
            placeholder="Іздеу..."
            className="w-full flex-1 p-4 md:p-5 rounded-2xl md:rounded-3xl border-2 text-black border-green-100 focus:border-green-500 outline-none shadow-md"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="w-full sm:w-auto bg-[#2ecc71] text-white px-8 md:px-10 py-4 md:py-0 rounded-2xl md:rounded-3xl font-bold hover:bg-[#27ae60] transition-all">
            Іздеу
          </button>
        </form>

        {loading && <div className="text-center py-10 font-bold text-green-600 animate-pulse">Жүктелуде...</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {recipes.map((meal) => (
            <div key={meal.idMeal} onClick={() => openRecipe(meal)} className="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-lg border border-green-100 cursor-pointer">
              <img src={meal.strMealThumb} className="w-full h-48 md:h-60 object-cover" alt="" />
              <div className="p-4 md:p-6 text-center sm:text-left">
                <h3 className="text-lg md:text-xl font-extrabold text-gray-800 leading-tight">{meal.strMealKaz}</h3>
                <p className="text-green-500 font-bold text-[10px] md:text-sm mt-1 uppercase italic">{meal.strAreaKaz}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Модальды терезе бейімделген */}
        {selectedMeal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] max-w-4xl w-full p-6 md:p-12 relative shadow-2xl max-h-[95vh] overflow-y-auto">
              <button onClick={() => setSelectedMeal(null)} className="absolute top-4 right-6 text-2xl font-light">✕</button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <img src={selectedMeal.strMealThumb} className="rounded-[1.5rem] md:rounded-[2rem] w-full h-48 sm:h-64 md:h-80 object-cover shadow-md" />
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 leading-tight">{selectedMeal.strMealKaz}</h2>
                  <h4 className="font-bold text-lg mb-2 border-l-4 border-green-500 pl-2">Құрамы:</h4>
                  <ul className="text-sm space-y-1 bg-green-50/50 p-4 rounded-xl max-h-40 overflow-y-auto">
                    {selectedMeal.ingredientsKaz.map((item: any, i: number) => (
                      <li key={i} className="flex justify-between border-b border-green-100 py-1">
                        <span>• {item.ing}</span>
                        <span className="font-bold text-green-600 text-xs">{item.measure}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-6 md:mt-8 bg-gray-50 p-4 md:p-6 rounded-2xl italic text-gray-700 text-sm md:text-base whitespace-pre-line">
                <h4 className="text-green-600 font-black mb-2 text-lg">Дайындалуы:</h4>
                {selectedMeal.strInstructionsKaz}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}