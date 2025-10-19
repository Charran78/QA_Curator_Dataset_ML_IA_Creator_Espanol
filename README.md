# 🚀 Curador QA Avanzado - QA Curator Pro

**QA Curator Pro es una plataforma avanzada que resuelve el cuello de botella crítico en el desarrollo de IA: la escasez de datasets de alta calidad en español. Nuestro sistema combina IA especializada con validación humana para transformar documentación técnica en pares pregunta-respuesta certificados, listos para fine-tuning de modelos.**

---

## 🌟 Características Principales

### ✅ **Implementado en v4.2**
- **🔄 Multi-Modalidad de Inferencia**: Soporte para modelos en la nube (Gemini) y locales (Ollama)
- **🎯 Especialización por Dominio**: Plugins para Medicina, Leyes, Tecnología y Finanzas
- **📊 Generación Estructurada**: JSON schema validation para outputs consistentes
- **⚡ Optimización para Modelos Pequeños**: Soporte robusto para phi3:mini y modelos locales
- **🎨 Interfaz Intuitiva**: Workflow visual con 5 pasos claramente definidos
- **📈 Métricas de Calidad**: Scoring heurístico automático con análisis de precisión
- **🔧 Edición en Tiempo Real**: Modificación y validación humana de pares QA
- **📥 Exportación Flexible**: Descarga en formato JSON listo para fine-tuning

### 🏗️ **En Desarrollo (v5.0)**
- **👥 Sistema de Anotadores**: Plataforma colaborativa con validación humana
- **🔍 Módulo de Búsqueda Avanzada**: Integración con APIs de búsqueda web
- **📚 Gestión de Proyectos**: Workspaces para equipos y organizaciones
- **🎚️ Control de Calidad Granular**: Sistema de puntuación multi-dimensional

### 🚀 **Roadmap Futuro**
- **🌐 API RESTful**: Para integración con otros sistemas
- **🔒 Sistema de Autenticación**: Roles y permisos granular
- **📊 Dashboard Analytics**: Métricas avanzadas de calidad de datos
- **🤖 Auto-ML Pipeline**: Fine-tuning automático de modelos
- **🌍 Multi-idioma**: Soporte para inglés, portugués y más

---

## 🎯 Estado del Proyecto
`MVP AVANZADO` → `BUSCANDO SOCIOS PARA ESCALAR A PRODUCCIÓN`

**Versión Actual**: v4.2 - "Local Inference Optimized"  
**Próxima Versión**: v5.0 - "Collaborative Annotation Platform"

---

## 🛠️ Instalación y Uso Rápido

### 🐳 **Opción 1: Docker (Recomendado - Sin dependencias locales)**
```bash
# 1. Clonar el proyecto
git clone [repository-url]
cd qa-curator-pro

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env y añadir: VITE_GEMINI_API_KEY=tu_clave_aqui

# 3. Ejecutar con Docker Compose
npm run docker:compose-dev

# La aplicación estará en: http://localhost:5173
```

### 💻 **Opción 2: Instalación Tradicional**
```bash
# 1. Clonar y configurar
git clone [repository-url]
cd qa-curator-pro
npm install
npm install lucide-react

# 2. Configurar variables de entorno
cp .env.example .env
# Crear archivo .env en la raíz y añadir:
VITE_GEMINI_API_KEY=tu_clave_aqui

# 3. Ejecutar en desarrollo
npm run dev

# La aplicación estará en: http://localhost:5173
```

### 🚀 **Opción 3: Producción con Docker**
```bash
# Build y ejecución en producción
npm run docker:build
npm run docker:run

# O usando docker-compose para producción
npm run docker:compose

# La aplicación estará en: http://localhost:3000
```

### **Comandos Docker Disponibles**
```bash
npm run docker:build      # Build de la imagen Docker
npm run docker:run        # Ejecutar contenedor
npm run docker:compose    # Production con Docker Compose  
npm run docker:compose-dev # Desarrollo con hot-reload
npm run docker:clean      # Limpiar contenedores e imágenes
```

### **Configuración Ollama (Modo Local)**
```bash
# Instalar Ollama (opcional para modo local)
curl -fsSL https://ollama.ai/install.sh | sh

# Descargar modelos recomendados
ollama pull phi3:mini
ollama pull llama3:8b

# Verificar instalación
ollama list
```

---

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build            # Build para producción
npm run preview          # Preview del build
npm run lint             # Linter de código

# Docker
npm run docker:build     # Build de imagen Docker
npm run docker:run       # Ejecutar contenedor
npm run docker:compose   # Production con Docker Compose
npm run docker:compose-dev # Desarrollo con Docker
npm run docker:clean     # Limpiar recursos Docker
```

---

## 🎯 Casos de Uso

### 🏥 **Sector Salud**
- Generación de datasets para asistentes médicos virtuales
- Preguntas y respuestas sobre protocolos médicos
- Entrenamiento de modelos para triaje automatizado

### ⚖️ **Sector Legal**
- Creación de datasets para consultas legales
- Análisis de jurisprudencia y normativas
- Asistentes para profesionales del derecho

### 💰 **Sector Financiero**
- Datasets para asesores financieros IA
- Preguntas sobre regulaciones financieras
- Análisis de documentación económica

### 🔧 **Sector Tecnológico**
- Documentación técnica para chatbots de soporte
- Preguntas frecuentes sobre productos
- Entrenamiento de modelos para customer service

---

## 💼 Modelo de Negocio

### **Open Core Strategy**
- 🔓 **Community Edition**: Gratuita para investigación, educación y proyectos open-source
- 💰 **Enterprise Edition**: Licencias comerciales con soporte premium y características avanzadas
- 🤝 **Partnerships**: Colaboraciones estratégicas con empresas y instituciones

### **Segmentos Objetivo**
- **🏢 Empresas Tech**: Necesitan datasets específicos para sus productos
- **🎓 Instituciones Educativas**: Investigación en NLP y desarrollo de IA
- **🏛️ Gobierno**: Digitalización de servicios públicos con IA conversacional
- **🏥 Healthcare**: Asistentes médicos con información validada

---

## 📊 Métricas Técnicas

### **Calidad de Datasets**
- **Precisión Heurística**: 85%+ en modelos locales optimizados
- **Consistencia Estructural**: Validación JSON schema 100%
- **Diversidad de Dificultad**: Mix balanceado básico/intermedio/avanzado
- **Trazabilidad Completa**: Metadata completa de origen y procesamiento

### **Rendimiento**
- **Tiempo de Generación**: 15-30 segundos por lote de 4-6 QA pairs
- **Soporte de Modelos**: phi3:mini, llama3:8b, Gemini Flash, y más
- **Escalabilidad**: Arquitectura preparada para procesamiento distribuido

---

## 🔬 Tecnologías Implementadas

### **Frontend**
- React 18 + Vite
- Tailwind CSS
- Lucide React (iconos)
- Context API para estado global

### **Infraestructura & DevOps**
- Docker & Docker Compose
- Nginx (servidor de producción)
- Multi-stage builds optimizados

### **Backend & IA**
- Google Gemini API
- Ollama (modelos locales)
- Fetch API con retry logic
- JSON Schema validation

### **Características Avanzadas**
- Hot-reload durante desarrollo
- Parsing tolerante a fallos
- Sistema de plugins extensible
- Métricas de calidad en tiempo real
- Entornos consistentes con Docker

---

## 🏢 Para Empresas e Inversores

### **Oportunidades de Colaboración**
- **📜 Licencias Exclusivas**: Por sector vertical (salud, legal, finanzas)
- **🤝 Joint Ventures**: Desarrollo de soluciones específicas por mercado
- **💼 Acuerdos de Implementación**: Personalización para casos de uso específicos
- **🔬 Investigación Conjunta**: Desarrollo de nuevas capacidades de IA

### **Propuesta de Valor**
- **⏱️ Reducción de Tiempo**: De meses a minutos en creación de datasets
- **💰 Ahorro de Costos**: 70%+ menos en anotación manual
- **🎯 Especialización**: Dominio específico vs. soluciones genéricas
- **🔒 Control**: Datos propios vs. dependencia de terceros

### **Mercado Objetivo**
- **Tamaño**: $2.3B mercado global de datasets de IA (2024)
- **Crecimiento**: 28% CAGR 2023-2028
- **Necesidad**: Escasez crítica de datos en español de calidad

---

## 🌟 Ventajas Competitivas

### **🔄 Dual Cloud/Local**
Única plataforma que funciona tanto con APIs cloud como modelos locales, garantizando continuidad y flexibilidad.

### **🎯 Especialización por Dominio**
No es un generador genérico - entiende contextos específicos de cada industria.

### **⚡ Optimización para Español**
Desarrollado específicamente para las particularidades del lenguaje español.

### **🔧 Validación Humana en el Loop**
Sistema diseñado para integración perfecta entre IA y expertos humanos.

### **🐳 Entorno Consistente**
Despliegue instantáneo con Docker - mismo comportamiento en desarrollo y producción.

---

## 📞 Contacto y Colaboraciones

**¿Interesado en licenciar la tecnología, invertir en el proyecto o explorar colaboraciones?**

### **Información de Contacto**
[📧 Email](beyond.digital.web@gmail.com) | 
[📋 Portafolio](https://pedromencias.netlify.app/) | 
[💼 LinkedIn](https://www.linkedin.com/in/pedro-menc%C3%ADas-68223336b/) | 
[☕ Invitar un Café](https://buymeacoffee.com/beyonddigiv)

### **Áreas de Interés Específico**
- 🤝 Partners de implementación por sector
- 💼 Empresas necesitando datasets específicos  
- 🔬 Instituciones de investigación
- 🎓 Universidades para proyectos académicos
- 🏢 Empresas tech para integraciones

---

## 🚀 Próximos Pasos

1. **🎯 v5.0**: Sistema colaborativo de anotadores
2. **🌐 v5.1**: API pública y documentación
3. **🏢 v5.2**: Módulo empresarial con RBAC
4. **🤖 v6.0**: Pipeline completo de AutoML

**¿Te interesa participar en alguna de estas fases? ¡Hablemos!**

---

*"Transformando documentación en inteligencia conversacional y datasets a la vez."*
