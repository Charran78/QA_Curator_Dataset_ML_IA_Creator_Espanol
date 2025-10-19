import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Download, Loader, AlertTriangle, CheckCircle, Brain, Database, FileText, Users, BarChart3, Shield, Zap, Target, Edit3, Trash2, Sparkles, Cpu, Workflow, Terminal, Upload, RotateCcw, Link, Cloud, HardDrive } from 'lucide-react';

// --- CONSTANTES GLOBALES Y CONFIGURACIÓN ---
const GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20';
const OLLAMA_URL = 'http://localhost:11434/api/generate';

// Clave de API desde variables de entorno
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

const INITIAL_DATASET_ID = `qa-ds-${Date.now()}`;

// --- VERIFICACIÓN DE CONECTIVIDAD OLLAMA ---
const checkOllamaHealth = async (url) => {
  try {
    const healthUrl = url.replace('/api/generate', '/api/tags');
    const response = await fetch(healthUrl, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    console.error('Ollama health check failed:', error);
    return false;
  }
};

// --- OBTENER MODELOS DISPONIBLES EN OLLAMA ---
const getAvailableOllamaModels = async (url) => {
  try {
    const modelsUrl = url.replace('/api/generate', '/api/tags');
    const response = await fetch(modelsUrl);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.models?.map(model => model.name) || [];
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return [];
  }
};

// --- FUNCIONES DE UTILIDAD ---
const downloadJson = (data, filename) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const calculateHeuristicMetrics = (qa) => {
    const difficultyMultipliers = {
        'básico': 1.0,
        'intermedio': 1.15,
        'avanzado': 1.3,
    };

    const maxAnswerLength = 300;
    const lengthRatio = Math.min(1.0, qa.answer.length / maxAnswerLength);
    const confidence = (0.7 + lengthRatio * 0.3).toFixed(4); 

    const diffMultiplier = difficultyMultipliers[qa.difficulty] || 1.0;
    const accuracy = Math.min(1.0, (0.75 + (diffMultiplier - 1.0) * 0.3)).toFixed(4); 

    const score = ((parseFloat(confidence) + parseFloat(accuracy)) / 2).toFixed(4);
    
    return { score, confidence, accuracy };
};

// --- FUNCIÓN MEJORADA PARA PARSEAR JSON ---
const safeJsonParse = (jsonText) => {
  try {
    console.log("Raw response from model:", jsonText);
    
    // Limpieza más agresiva del texto
    let cleanedText = jsonText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/^[^{[]*/, '')
      .replace(/[^}\]]*$/, '')
      .trim();

    // Si está vacío después de limpiar, lanza error
    if (!cleanedText) {
      throw new Error('Respuesta vacía después de limpieza');
    }

    // Intentar parsear
    const parsed = JSON.parse(cleanedText);
    
    // Validar estructura básica
    if (!Array.isArray(parsed)) {
      throw new Error('La respuesta no es un array');
    }
    
    if (parsed.length === 0) {
      throw new Error('El array está vacío');
    }

    // Validar estructura de cada objeto
    parsed.forEach((item, index) => {
      if (!item.question || !item.answer) {
        throw new Error(`El item ${index} no tiene question o answer`);
      }
      
      // Asegurar que difficulty tenga un valor válido
      if (!item.difficulty) {
        item.difficulty = 'intermedio';
      } else if (!['básico', 'intermedio', 'avanzado'].includes(item.difficulty)) {
        item.difficulty = 'intermedio';
      }
    });

    return parsed;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    console.error('Original text:', jsonText);
    
    // Intentar extracción de emergencia
    const fallback = extractJSONFromText(jsonText);
    if (fallback) {
      console.log('Usando extracción de emergencia');
      return fallback;
    }
    
    throw new Error(`JSON inválido: ${error.message}. El modelo no siguió las instrucciones.`);
  }
};

// --- FUNCIÓN DE EXTRACCIÓN DE EMERGENCIA ---
const extractJSONFromText = (text) => {
  try {
    // Buscar patrones que parezcan arrays JSON
    const arrayMatch = text.match(/\[\s*{[\s\S]*}\s*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    
    // Buscar objetos individuales y agruparlos
    const objectMatches = text.match(/{[\s\S]*?}(?=\s*{|\s*$)/g);
    if (objectMatches && objectMatches.length > 0) {
      const objects = objectMatches.map(match => {
        try {
          return JSON.parse(match);
        } catch (e) {
          return null;
        }
      }).filter(obj => obj && obj.question && obj.answer);
      
      if (objects.length > 0) return objects;
    }
    
    return null;
  } catch (error) {
    console.error('Fallback extraction failed:', error);
    return null;
  }
};

// --- PLUGINS DE DOMINIO OPTIMIZADOS ---
const createDomainPlugin = (domain, config) => ({
  id: domain,
  name: config.label,
  icon: config.icon,
  color: config.color,
  colorClass: config.colorClass,
  recommendedModels: {
    small: `phi3:mini`,
    medium: `llama3:8b`, 
    large: `mixtral:8x7b`
  },
  // SYSTEM PROMPT MEJORADO para modelos pequeños
  systemPrompt: `Eres un experto en ${config.label}. Genera EXCLUSIVAMENTE un array JSON válido.

**INSTRUCCIONES:**
1. SOLO responde con JSON válido, sin texto adicional
2. Estructura: [{"question": "...", "answer": "...", "difficulty": "básico|intermedio|avanzado"}]
3. Usa SOLO información del texto proporcionado
4. Máximo ${config.numPairs} pares QA
5. Dificultad variada

**EJEMPLO:**
[
  {
    "question": "Pregunta clara",
    "answer": "Respuesta basada en el texto", 
    "difficulty": "intermedio"
  }
]`,
  jsonSchema: {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        "question": { "type": "STRING", "description": "Pregunta sobre el texto" },
        "answer": { "type": "STRING", "description": "Respuesta basada en el texto" },
        "difficulty": { "type": "STRING", "enum": ["básico", "intermedio", "avanzado"], "description": "Nivel de dificultad" }
      },
      "propertyOrdering": ["question", "answer", "difficulty"]
    }
  }
});

const DOMAIN_PLUGINS = [
  createDomainPlugin('medicina', { 
    label: 'Medicina', 
    icon: Shield, 
    color: 'red',
    colorClass: {
      text: 'text-red-500',
      border: 'border-red-500',
      bg: 'bg-red-50'
    },
    numPairs: 4  // REDUCIDO para modelos pequeños
  }),
  createDomainPlugin('leyes', { 
    label: 'Leyes/Derecho', 
    icon: Users, 
    color: 'blue',
    colorClass: {
      text: 'text-blue-500',
      border: 'border-blue-500',
      bg: 'bg-blue-50'
    },
    numPairs: 4 
  }),
  createDomainPlugin('tecnologia', { 
    label: 'Tecnología', 
    icon: Zap, 
    color: 'green',
    colorClass: {
      text: 'text-green-500',
      border: 'border-green-500',
      bg: 'bg-green-50'
    },
    numPairs: 4 
  }),
  createDomainPlugin('finanzas', { 
    label: 'Finanzas/Economía', 
    icon: Target, 
    color: 'purple',
    colorClass: {
      text: 'text-purple-500',
      border: 'border-purple-500',
      bg: 'bg-purple-50'
    },
    numPairs: 4 
  })
];

// --- COMPONENTES ---
const WorkflowManager = ({ currentStep, steps }) => (
  <nav className="mb-8 flex justify-center bg-white p-4 rounded-2xl shadow-xl border border-gray-200">
    <ol className="flex items-center space-x-4 w-full justify-around">
      {steps.map((step, index) => {
        const isActive = index <= currentStep;
        const isCurrent = index === currentStep;

        return (
          <li key={step.id} className="flex-1 flex flex-col items-center relative">
            {index !== 0 && (
              <div 
                className={`absolute w-full top-3 -left-1/2 h-1 transition-all duration-300 z-0 ${
                  isActive ? 'bg-indigo-400' : 'bg-gray-200'
                }`}
              ></div>
            )}
            
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-6 h-6 flex items-center justify-center rounded-full font-bold transition-all duration-300 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-300'
                    : isActive
                    ? 'bg-indigo-400 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              <span className={`mt-2 text-xs font-medium text-center transition-colors duration-300 ${
                isActive ? 'text-gray-800' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  </nav>
);

const ModelSelector = ({ domain, apiMode, localModel, setLocalModel, availableModels, onRefreshModels }) => {
  const plugin = DOMAIN_PLUGINS.find(p => p.id === domain);

  if (!plugin) return null;
  
  const modelInUse = apiMode === 'cloud' ? GEMINI_MODEL : localModel;

  // Detectar si el modelo es pequeño
  const isSmallModel = localModel && (
    localModel.includes(':2b') || 
    localModel.includes(':1b') ||
    localModel.includes(':3b') ||
    localModel.includes('tiny') ||
    localModel.includes('mini') ||
    localModel.includes('phi3')
  );

  const renderLocalModelSelector = () => {
    if (availableModels.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm mb-2">
            No se detectaron modelos en Ollama. Asegúrate de tener modelos instalados.
          </p>
          <button
            onClick={onRefreshModels}
            className="flex items-center text-xs text-yellow-700 hover:text-yellow-800"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reintentar detección
          </button>
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Modelo Local Disponible
          {isSmallModel && (
            <span className="ml-2 text-xs text-orange-600 font-normal">
              ⚠️ Modelo pequeño - limitado a 4 QA pairs
            </span>
          )}
        </label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {availableModels.map((model) => (
            <div
              key={model}
              className={`p-2 border rounded-lg cursor-pointer transition-all ${
                localModel === model
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setLocalModel(model)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{model}</span>
                {localModel === model && (
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onRefreshModels}
          className="mt-2 flex items-center text-xs text-gray-500 hover:text-gray-700"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Actualizar lista
        </button>
      </div>
    );
  };

  const renderCloudModelInfo = () => {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Modelo en la Nube
        </label>
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
          <div className="p-2 border border-gray-100 rounded-lg bg-white">
            <span className="text-xs font-bold text-gray-800 block">Gemini:</span>
            <p className="text-xs text-gray-600 truncate mt-1">{GEMINI_MODEL}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {apiMode === 'cloud' ? renderCloudModelInfo() : renderLocalModelSelector()}
      <p className="text-xs text-gray-500 mt-2">
        <Sparkles className="w-3 h-3 inline mr-1 text-purple-400" />
        Motor Actual: <strong className='text-gray-700'>{modelInUse}</strong>
      </p>
    </div>
  );
};

const APIModeSelector = ({ apiMode, setApiMode, customLocalUrl, setCustomLocalUrl, localHealth }) => {
    const isCloud = apiMode === 'cloud';
    
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                2. Motor de Inferencia (API)
            </label>
            <div className="flex bg-gray-100 p-1 rounded-xl mb-3">
                <button
                    onClick={() => setApiMode('cloud')}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center ${
                        isCloud ? 'bg-white shadow-md text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                    }`}
                >
                    <Cloud className="w-4 h-4 mr-2" /> Modo Nube (Gemini)
                </button>
                <button
                    onClick={() => setApiMode('local')}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center ${
                        !isCloud ? 'bg-white shadow-md text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                    }`}
                >
                    <HardDrive className="w-4 h-4 mr-2" /> 
                    Modo Local (Ollama)
                    {localHealth !== null && (
                        <span className={`ml-1 w-2 h-2 rounded-full ${
                            localHealth ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                    )}
                </button>
            </div>

            {!isCloud && (
                <div className="mt-2 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                        URL del Servidor Local (Ej: Ollama)
                    </label>
                    <input
                        type="text"
                        value={customLocalUrl}
                        onChange={(e) => setCustomLocalUrl(e.target.value)}
                        placeholder={OLLAMA_URL}
                        className="w-full p-2 border border-indigo-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                    />
                    <div className="flex items-center mt-2">
                        {localHealth !== null && (
                            <div className={`text-xs font-medium ${
                                localHealth ? 'text-green-600' : 'text-red-600'
                            }`}>
                                <AlertTriangle className="w-3 h-3 inline mr-1" />
                                {localHealth ? 'Conectado' : 'No conectado'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- COMPONENTE PRINCIPAL OPTIMIZADO ---
const App = () => {
  const [inputMode, setInputMode] = useState('text');
  const [sourceContent, setSourceContent] = useState('');
  const [domain, setDomain] = useState(DOMAIN_PLUGINS[0].id);
  const [curatedData, setCuratedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [datasetId] = useState(INITIAL_DATASET_ID);
  const [apiMode, setApiMode] = useState('cloud');
  const [customLocalUrl, setCustomLocalUrl] = useState(OLLAMA_URL);
  const [localHealth, setLocalHealth] = useState(null);
  const [localModel, setLocalModel] = useState('phi3:mini'); // Cambiado a phi3:mini por defecto
  const [availableModels, setAvailableModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || "");

  // Actualiza la constante apiKey para usar el estado
  const apiKey = geminiApiKey;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const currentPlugin = DOMAIN_PLUGINS.find(p => p.id === domain);

  const workflowSteps = [
    { id: 'input', label: 'Fuente' },
    { id: 'analysis', label: 'Análisis IA' },
    { id: 'generation', label: 'Curación JSON' },
    { id: 'validation', label: 'Validación' },
    { id: 'export', label: 'Exportar' }
  ];
  
  useEffect(() => {
    if (apiMode === 'local') {
      checkOllamaHealth(customLocalUrl).then(health => {
        setLocalHealth(health);
        if (health) {
          loadAvailableModels();
        }
      });
    } else {
      setLocalHealth(null);
      setAvailableModels([]);
    }
  }, [apiMode, customLocalUrl]);

  const loadAvailableModels = useCallback(async () => {
    if (apiMode !== 'local') return;
    
    setIsLoadingModels(true);
    try {
      const models = await getAvailableOllamaModels(customLocalUrl);
      setAvailableModels(models);
      
      if (models.length > 0 && (!localModel || !models.includes(localModel))) {
        setLocalModel(models[0]);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [apiMode, customLocalUrl, localModel]);

  const handleReset = useCallback(() => {
    setSourceContent('');
    setCuratedData(null);
    setError('');
    setCurrentStep(0);
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(''); 
    
    const fileName = file.name.toLowerCase();
    const binaryExtensions = ['.docx', '.xlsx', '.epub', '.doc', '.xlxs'];
    const isBinary = binaryExtensions.some(ext => fileName.endsWith(ext));

    if (isBinary) {
        setError('ADVERTENCIA: Archivos binarios (DOCX, XLSX, EPUB, etc.) no pueden ser leídos directamente. Recomendamos COPIAR Y PEGAR el texto.');
    }

    if (file.size > 1024 * 1024 * 5) {
        setError('El archivo es demasiado grande (máx 5MB).');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        setSourceContent(e.target.result);
        if (!isBinary) setError(''); 
    };
    reader.onerror = () => {
        setError('Error al leer el archivo. Asegúrate de que sea un archivo de texto válido.');
    };
    
    reader.readAsText(file);
    event.target.value = ''; 
  };
  
  const fetchWithRetry = useCallback(async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;
        
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            if (response.status === 401 || response.status === 403) {
                 console.error(`ERROR DE AUTENTICACIÓN/PERMISO: Status ${response.status}. Verifica tu clave de API.`);
            }
            throw new Error(`API Error: ${response.status} - ${await response.text()}`);
        }
        
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (e) {
        if (i === retries - 1) throw e;
      }
    }
    throw new Error('API request failed after multiple retries.');
  }, []);

  const getResponseText = (result, apiMode) => {
    if (apiMode === 'cloud') {
      return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      return result.response;
    }
  };

  const handleCurate = useCallback(async () => {
    if (sourceContent.length < (inputMode === 'text' ? 100 : 5)) {
        setError(inputMode === 'text' 
            ? 'El texto debe tener al menos 100 caracteres.'
            : 'Por favor, introduce una URL o una consulta de búsqueda.');
        return;
    }

    if (apiMode === 'local' && (!localModel || availableModels.length === 0)) {
        setError('Por favor, selecciona un modelo local válido.');
        return;
    }

    setError('');
    setIsLoading(true);
    setCurrentStep(1); 
    
    let finalUserPrompt = '';
    let tools = [];
    
    // NÚMERO DE PARES OPTIMIZADO: 4 para local, 6 para cloud
    const numPairs = apiMode === 'local' ? 4 : 6;
    
    let currentApiUrl = '';
    let currentModelName = '';

    if (apiMode === 'cloud') {
        currentApiUrl = GEMINI_API_URL;
        currentModelName = GEMINI_MODEL;
    } else {
        currentApiUrl = customLocalUrl;
        currentModelName = localModel;
    }

    if (inputMode === 'web') {
        tools = [{ "google_search": {} }];
        finalUserPrompt = `Analiza la información proporcionada por las fuentes de Google Search relacionadas con "${sourceContent}" y genera un array de objetos JSON con ${numPairs} pares de preguntas y respuestas. La generación debe estar estrictamente basada en el contenido de esas fuentes web y en el dominio de ${currentPlugin.name}.`;
    } else { 
        // PROMPT MEJORADO para modelos locales
        if (apiMode === 'local') {
          finalUserPrompt = `TEXTO FUENTE: ${sourceContent}

GENERA EXACTAMENTE ${numPairs} PARES QA EN FORMATO JSON.

INSTRUCCIONES:
- SOLO responde con JSON válido
- Cada objeto debe tener: question, answer, difficulty
- Usa SOLO información del texto proporcionado
- Dificultad: básico, intermedio o avanzado

RESPONDE SOLO CON EL JSON, NADA MÁS.`;
        } else {
          finalUserPrompt = `A partir del siguiente texto fuente especializado en ${currentPlugin.name}, genera un array de objetos JSON con ${numPairs} pares de preguntas y respuestas. Usa solo la información proporcionada en el texto. TEXTO FUENTE:\n\n---\n${sourceContent}\n---`;
        }
    }

    try {
      let payload, options;

      if (apiMode === 'cloud') {
        payload = {
          contents: [{ parts: [{ text: finalUserPrompt }] }],
          systemInstruction: {
            parts: [{ text: currentPlugin.systemPrompt }]
          },
          tools: (apiMode === 'cloud' && inputMode === 'web') ? tools : undefined,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: currentPlugin.jsonSchema
          }
        };
      } else {
        // CONFIGURACIÓN OPTIMIZADA para modelos locales
        payload = {
          model: localModel,
          prompt: `${currentPlugin.systemPrompt}\n\n${finalUserPrompt}`,
          stream: false,
          format: "json",
          options: {
            temperature: 0.3,        // Menos creatividad, más estructura
            top_p: 0.9,
            top_k: 40,
            num_predict: 1024        // Limitar longitud para modelos pequeños
          }
        };
      }

      options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      };

      const response = await fetchWithRetry(currentApiUrl, options);
      const result = await response.json();
      
      setCurrentStep(2);

      const jsonText = getResponseText(result, apiMode);
      if (!jsonText) {
        throw new Error('La IA no pudo generar contenido válido.');
      }
      
      console.log("Respuesta cruda del modelo:", jsonText);
      
      const newQaPairs = safeJsonParse(jsonText);
      
      if (!Array.isArray(newQaPairs) || newQaPairs.length === 0) {
         throw new Error('El formato JSON es incorrecto o está vacío.');
      }

      const formattedNewPairs = newQaPairs.map((qa, i) => {
        const metrics = calculateHeuristicMetrics(qa);
        
        return {
          ...qa,
          qa_id: `${domain}-qa-${Date.now()}-${i + (curatedData?.qa_pairs?.length || 0)}`,
          score: metrics.score, 
          traceability: { confidence_level: metrics.confidence, source_type: inputMode }, 
          metadata: {
            difficulty: qa.difficulty || 'intermedio',
            edited: false,
            quality_metrics: { accuracy: metrics.accuracy } 
          }
        };
      });

      const existingPairs = curatedData?.qa_pairs || [];
      const combinedPairs = [...existingPairs, ...formattedNewPairs];

      const overallScore = (combinedPairs.reduce((sum, qa) => sum + parseFloat(qa.score), 0) / combinedPairs.length).toFixed(4);
      const assessmentLevel = parseFloat(overallScore) > 0.85 ? 'avanzado' : 'intermedio';

      const finalResult = {
        dataset_id: datasetId,
        domain: domain,
        model_used: currentModelName,
        overall_accuracy_score: overallScore,
        quality_assessment: { 
          level: assessmentLevel, 
          color: assessmentLevel === 'avanzado' ? 'text-green-600' : 'text-orange-600', 
          bgColor: assessmentLevel === 'avanzado' ? 'bg-green-100' : 'bg-orange-100' 
        },
        qa_pairs: combinedPairs,
      };

      setCuratedData(finalResult);
      setCurrentStep(3); 
    } catch (e) {
      console.error("Error en la curación (IA):", e);
      setError('Error en la generación de IA: ' + e.message);
      setCurrentStep(0); 
    } finally {
      setIsLoading(false);
    }
  }, [inputMode, sourceContent, domain, currentPlugin, curatedData, datasetId, apiMode, customLocalUrl, localModel, availableModels, fetchWithRetry]);
  
  const handleEditQA = (qaId, field, value) => {
    setCuratedData(prev => {
        if (!prev) return prev;
        
        const updatedPairs = prev.qa_pairs.map(qa => 
            qa.qa_id === qaId 
              ? { ...qa, [field]: value, metadata: { ...qa.metadata, edited: true } }
              : qa
        );
        
        return { ...prev, qa_pairs: updatedPairs };
    });
  };
  
  const handleDeleteQA = useCallback((qaId) => {
    setCuratedData(prev => {
        if (!prev) return null;

        const updatedPairs = prev.qa_pairs.filter(qa => qa.qa_id !== qaId);

        if (updatedPairs.length === 0) {
            return null; 
        }

        const overallScore = (updatedPairs.reduce((sum, qa) => sum + parseFloat(qa.score), 0) / updatedPairs.length).toFixed(4);
        const assessmentLevel = parseFloat(overallScore) > 0.85 ? 'avanzado' : 'intermedio';

        return {
            ...prev,
            overall_accuracy_score: overallScore,
            quality_assessment: { 
                level: assessmentLevel, 
                color: assessmentLevel === 'avanzado' ? 'text-green-600' : 'text-orange-600', 
                bgColor: assessmentLevel === 'avanzado' ? 'bg-green-100' : 'bg-orange-100' 
            },
            qa_pairs: updatedPairs,
        };
    });
  }, []);

  const handleDownload = () => {
      if (curatedData) {
          downloadJson(curatedData, `${curatedData.dataset_id}-${curatedData.qa_pairs.length}items.json`);
          setCurrentStep(4);
      }
  };

  const getSourceInputLabel = () => {
    return inputMode === 'web' 
        ? 'URL o Consulta de Búsqueda (Acceso Web)' 
        : `Contenido Fuente (${sourceContent.length} caracteres - Mínimo 100)`;
  };
  
  const getSourcePlaceholder = () => {
    return inputMode === 'web' 
        ? 'Ej: "Últimas regulaciones de IA en la UE" o "https://ejemplo.com/doc-especializado"'
        : `Ingrese documentación especializada en ${currentPlugin?.name} para generar nuevos pares QA...`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 p-8 bg-white shadow-2xl rounded-2xl border border-blue-200">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-12 h-12 mr-4 text-indigo-600" />
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                QA Curator Pro
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Curación de Dataset con Selección de Modelos Locales
              </p>
            </div>
          </div>
        </header>

        <WorkflowManager 
          currentStep={currentStep}
          steps={workflowSteps}
        />
        
        {error && (
          <div className={`p-4 mb-6 ${error.includes('ADVERTENCIA') ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-red-100 border-red-400 text-red-700'} rounded-xl flex items-center`}>
            <AlertTriangle className="w-5 h-5 mr-3" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                {currentPlugin && React.createElement(currentPlugin.icon, { 
                  className: `w-6 h-6 mr-3 ${currentPlugin.colorClass.text}` 
                })}
                1. Configuración de Curación
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dominio Especializado
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {DOMAIN_PLUGINS.map((plugin) => {
                      const Icon = plugin.icon;
                      return (
                        <button
                          key={plugin.id}
                          onClick={() => setDomain(plugin.id)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            domain === plugin.id 
                              ? `${plugin.colorClass.border} ${plugin.colorClass.bg} shadow-sm` 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mb-1 mx-auto ${plugin.colorClass.text}`} />
                          <span className="text-xs font-medium text-gray-700 text-center block">
                            {plugin.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <APIModeSelector 
                    apiMode={apiMode} 
                    setApiMode={setApiMode}
                    customLocalUrl={customLocalUrl}
                    setCustomLocalUrl={setCustomLocalUrl}
                    localHealth={localHealth}
                />
                
                <ModelSelector 
                  domain={domain}
                  apiMode={apiMode}
                  localModel={localModel}
                  setLocalModel={setLocalModel}
                  availableModels={availableModels}
                  onRefreshModels={loadAvailableModels}
                />

                <div className='pt-2'>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tipo de Fuente
                    </label>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => { setInputMode('text'); setSourceContent(''); setError(''); }}
                            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center ${
                                inputMode === 'text' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                            }`}
                        >
                            <FileText className="w-4 h-4 mr-2" /> Entrada de Texto/Archivo
                        </button>
                        <button
                            onClick={() => { setInputMode('web'); setSourceContent(''); setError(''); }}
                            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center ${
                                inputMode === 'web' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                            }`}
                            disabled={apiMode === 'local'}
                            title={apiMode === 'local' ? "El modo Local no soporta Google Search Grounding." : "Usar Google Search para encontrar información."}
                        >
                            <Link className="w-4 h-4 mr-2" /> URL o Consulta Web
                        </button>
                    </div>
                </div>
                
                <div>
                  <div className='flex items-end justify-between mb-2'>
                    <p>
                      <label className="block text-sm font-semibold text-gray-700">
                        {getSourceInputLabel()}
                      </label>
                    </p>
                    
                    {inputMode === 'text' && (
                        <label 
                            htmlFor="file-upload" 
                            className="flex items-center text-xs font-medium text-indigo-600 bg-indigo-50 p-2 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
                            title="Subir archivo de texto (.txt) o binario (DOCX, XLSX, EPUB, etc.)."
                        >
                            <Upload className="w-3 h-3 mr-1" />
                            Cargar Archivo
                            <input id="file-upload" type="file" onChange={handleFileUpload} className="hidden" accept=".txt,.md,.json,.csv,.docx,.xlsx,.epub,.doc,.xlxs" />
                        </label>
                    )}
                  </div>
                  <textarea
                    rows={inputMode === 'web' ? '2' : '6'}
                    value={sourceContent}
                    onChange={(e) => setSourceContent(e.target.value)}
                    placeholder={getSourcePlaceholder()}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 resize-none text-sm"
                    disabled={isLoading || (apiMode === 'local' && inputMode === 'web')}
                  />
                </div>

                <div className="flex space-x-4">
                    <button
                        onClick={handleReset}
                        disabled={isLoading}
                        className="flex-grow py-3 px-6 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-400 text-gray-700 font-semibold rounded-xl shadow-md transition-all duration-200 flex items-center justify-center"
                    >
                        <RotateCcw className="w-5 h-5 mr-3" />
                        Restablecer Campos
                    </button>
                    <button
                        onClick={handleCurate}
                        disabled={isLoading || sourceContent.length < (inputMode === 'text' ? 100 : 5) || (apiMode === 'local' && inputMode === 'web') || (apiMode === 'local' && availableModels.length === 0)}
                        className="flex-grow py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center"
                        title={curatedData ? "Añadir nuevos QA Pairs al dataset existente" : "Generar el primer Dataset"}
                    >
                        {isLoading ? (
                            <>
                                <Loader className="animate-spin w-5 h-5 mr-3" />
                                {apiMode === 'cloud' ? 'Invocando Gemini...' : `Ejecutando ${localModel}...`}
                            </>
                        ) : (
                            <>
                                <Terminal className="w-5 h-5 mr-3" />
                                {curatedData ? 'Añadir Nuevos QA Pairs' : 'Generar Dataset QA'}
                            </>
                        )}
                    </button>
                </div>
              </div>
            </section>

            {curatedData && (
              <section className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl shadow-xl border-2 border-green-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-green-800 flex items-center">
                    <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
                    Dataset Generado - {curatedData.qa_pairs.length} QA Pairs Acumulados
                  </h2>
                  <div className={`px-3 py-1 rounded-full ${curatedData.quality_assessment.bgColor} ${curatedData.quality_assessment.color} font-bold text-sm`}>
                    Calidad: {curatedData.quality_assessment.level.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {curatedData.qa_pairs.map((qa, index) => (
                    <div key={qa.qa_id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                            #{index + 1} • {qa.difficulty}
                          </span>
                          {qa.metadata.edited && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              Editado
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDeleteQA(qa.qa_id)} 
                            className="p-1 text-red-500 hover:text-red-700 transition-colors"
                            title="Eliminar QA"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Pregunta:</label>
                        <textarea
                          value={qa.question}
                          onChange={(e) => handleEditQA(qa.qa_id, 'question', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none"
                          rows="2"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Respuesta:</label>
                        <textarea
                          value={qa.answer}
                          onChange={(e) => handleEditQA(qa.qa_id, 'answer', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none"
                          rows="3"
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <div className="space-x-3">
                          <span>Score Heurístico: <strong>{qa.score}</strong></span>
                          <span>Fuente: <strong>{qa.traceability.source_type.toUpperCase()}</strong></span>
                          <span>Precisión Heurística: <strong>{qa.metadata.quality_metrics.accuracy}</strong></span>
                        </div>
                        <span className="text-xs text-gray-400">
                          Modelo: {curatedData.model_used}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2 px-6 rounded-lg font-semibold shadow-lg transition-all flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar JSON ({curatedData.qa_pairs.length} Items)
                  </button>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            {curatedData && (
              <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                  Análisis de Calidad Heurística
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Score Promedio Heurístico:</span>
                    <span className="font-bold text-green-600">{curatedData.overall_accuracy_score}</span>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>ID del Dataset:</span>
                      <span className="font-medium truncate">{curatedData.dataset_id}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Total QA Pairs:</span>
                      <span className="font-medium">{curatedData.qa_pairs.length}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Motor de Inferencia:</span>
                      <span className="font-medium">{curatedData.model_used}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Cpu className="w-5 h-5 mr-2 text-purple-500" />
                Sistema v4.2 (Optimizado para phi3:mini)
              </h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Plataforma:</span>
                  <span className="font-medium">React (JSX)</span>
                </div>
                <div className="flex justify-between">
                  <span>Inferencia Activa:</span>
                  <span className={`font-medium ${apiMode === 'cloud' ? 'text-indigo-600' : 'text-green-600'}`}>
                    {apiMode === 'cloud' ? 'NUBE (Gemini)' : 'LOCAL (Ollama)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Modelos Detectados:</span>
                  <span className="font-medium">{availableModels.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Generación:</span>
                  <span className="font-medium">JSON Estructurado</span>
                </div>
              </div>
            </div>

            {apiMode === 'local' && availableModels.length > 0 && (
              <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <HardDrive className="w-5 h-5 mr-2 text-blue-500" />
                  Modelos Locales Disponibles
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableModels.map((model, index) => (
                    <div
                      key={model}
                      className={`p-2 text-xs rounded-lg ${
                        model === localModel 
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' 
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{model}</span>
                        {model === localModel && (
                          <CheckCircle className="w-3 h-3 text-indigo-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
  <p className="mb-3">
    <span className="text-gray-400">Desarrollado por</span>
    <span className="text-indigo-400"> ©Pedro Mencías</span>
    <span className="text-gray-400"> en</span>
    <span className="text-indigo-400"> 2025</span>
  </p>
  
  {/* Badges en línea con espacios y seguridad */}
  <div className="flex justify-center items-center gap-3 mb-3">
    <a 
      href="https://www.linkedin.com/in/pedro-menc%C3%ADas-68223336b/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-block transition-transform hover:scale-110"
    >
      <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
    </a>
    <a 
      href="https://github.com/Charran78" 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-block transition-transform hover:scale-110"
    >
      <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
    </a>
    <a 
      href="https://pedromencias.netlify.app/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-block transition-transform hover:scale-110"
    >
      <img src="https://img.shields.io/badge/netlify-000000?style=for-the-badge&logo=netlify&logoColor=#FF7139" alt="Portfolio" />
    </a>
    <a 
      href="https://buymeacoffee.com/beyonddigiv" 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-block transition-transform hover:scale-110"
    >
      <img src="https://img.shields.io/badge/buymeacoffee-FF0000?style=for-the-badge&logo=buymeacoffee&logoColor=yellow" alt="buymeacoffee" />
    </a>
  </div>
  
  <div className="text-gray-400">
    <span className="font-bold">Versión:</span> 4.2
  </div>
</footer>
        
    </div>
  );
};

export default App;