import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, 
  Save, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  Shuffle,
  Clock
} from "lucide-react";

interface InterviewFormProps {
  selectedResearch: string;
  onComplete: () => void;
}

interface Question {
  id: string;
  type: 'radio' | 'textarea' | 'select' | 'demographic';
  text: string;
  options?: string[];
  required: boolean;
  randomizeOptions?: boolean;
}

interface Interview {
  researchId: string;
  location: { lat: number; lng: number } | null;
  startTime: Date;
  answers: Record<string, string>;
  demographicData: {
    age: string;
    gender: string;
    education: string;
    income: string;
    neighborhood: string;
  };
}

export const InterviewForm = ({ selectedResearch, onComplete }: InterviewFormProps) => {
  const [currentStep, setCurrentStep] = useState<'location' | 'demographic' | 'questions' | 'review'>('location');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [interview, setInterview] = useState<Interview>({
    researchId: selectedResearch,
    location: null,
    startTime: new Date(),
    answers: {},
    demographicData: {
      age: '',
      gender: '',
      education: '',
      income: '',
      neighborhood: ''
    }
  });

  // Sample questions for electoral research
  const questions: Question[] = [
    {
      id: 'voting_intention_spontaneous',
      type: 'textarea',
      text: 'Se a eleição fosse hoje, em quem você votaria para prefeito? (Resposta espontânea)',
      required: true
    },
    {
      id: 'voting_intention_stimulated',
      type: 'radio',
      text: 'E se os candidatos fossem estes, em quem você votaria?',
      options: ['Candidato A', 'Candidato B', 'Candidato C', 'Candidato D', 'Voto nulo', 'Voto em branco', 'Não sabe/Não respondeu'],
      required: true,
      randomizeOptions: true
    },
    {
      id: 'mayor_evaluation',
      type: 'radio',
      text: 'Como você avalia a gestão do atual prefeito?',
      options: ['Ótima', 'Boa', 'Regular', 'Ruim', 'Péssima', 'Não sabe/Não opina'],
      required: true
    },
    {
      id: 'main_problem',
      type: 'radio',
      text: 'Qual o principal problema da sua cidade?',
      options: ['Saúde', 'Educação', 'Segurança', 'Transporte', 'Emprego', 'Habitação', 'Meio Ambiente', 'Outros'],
      required: true,
      randomizeOptions: true
    },
    {
      id: 'vote_certainty',
      type: 'radio',
      text: 'Quão certo você está do seu voto?',
      options: ['Totalmente certo', 'Muito certo', 'Pouco certo', 'Pode mudar', 'Não sabe'],
      required: true
    }
  ];

  // Get location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(coords);
          setInterview(prev => ({ ...prev, location: coords }));
          setLocationError(null);
        },
        (error) => {
          setLocationError('Não foi possível obter sua localização. Verifique as permissões e tente novamente.');
        }
      );
    } else {
      setLocationError('Geolocalização não é suportada neste dispositivo.');
    }
  }, []);

  // Randomize options for questions that require it
  const getQuestionOptions = (question: Question) => {
    if (!question.options) return [];
    
    if (question.randomizeOptions) {
      const shuffled = [...question.options];
      // Keep "Não sabe/Não respondeu" and similar at the end
      const fixed = shuffled.filter(opt => 
        opt.includes('Não sabe') || 
        opt.includes('Não respondeu') || 
        opt.includes('nulo') || 
        opt.includes('branco')
      );
      const toShuffle = shuffled.filter(opt => !fixed.includes(opt));
      
      // Simple shuffle
      for (let i = toShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [toShuffle[i], toShuffle[j]] = [toShuffle[j], toShuffle[i]];
      }
      
      return [...toShuffle, ...fixed];
    }
    
    return question.options;
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setInterview(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer
      }
    }));
  };

  const handleDemographicChange = (field: string, value: string) => {
    setInterview(prev => ({
      ...prev,
      demographicData: {
        ...prev.demographicData,
        [field]: value
      }
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setCurrentStep('review');
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      setCurrentStep('demographic');
    }
  };

  const canProceedFromLocation = () => {
    return location !== null && locationError === null;
  };

  const canProceedFromDemographic = () => {
    const demo = interview.demographicData;
    return demo.age && demo.gender && demo.education && demo.income && demo.neighborhood;
  };

  const canAnswerCurrentQuestion = () => {
    const question = questions[currentQuestion];
    return interview.answers[question.id] !== undefined;
  };

  const submitInterview = () => {
    // Here you would submit to your backend
    console.log('Submitting interview:', interview);
    
    // Show success message and return to dashboard
    onComplete();
  };

  const progressPercentage = () => {
    if (currentStep === 'location') return 10;
    if (currentStep === 'demographic') return 25;
    if (currentStep === 'questions') return 25 + ((currentQuestion + 1) / questions.length) * 65;
    if (currentStep === 'review') return 100;
    return 0;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span>Aplicar Entrevista</span>
          </CardTitle>
          <CardDescription>
            Pesquisa: {selectedResearch || 'Intenção de Voto - São Paulo Capital'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso da Entrevista</span>
              <span>{Math.round(progressPercentage())}%</span>
            </div>
            <Progress value={progressPercentage()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Location Verification */}
      {currentStep === 'location' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Verificação de Localização</span>
            </CardTitle>
            <CardDescription>
              Confirme sua localização para aplicar a entrevista
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {locationError ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            ) : location ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Localização confirmada! Você está autorizado a aplicar entrevistas nesta região.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Obtendo sua localização via GPS...
                </AlertDescription>
              </Alert>
            )}

            {location && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Dados da Localização</h4>
                <div className="text-sm space-y-1">
                  <p>Latitude: {location.lat.toFixed(6)}</p>
                  <p>Longitude: {location.lng.toFixed(6)}</p>
                  <p>Região: Centro - São Paulo</p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                variant="electoral" 
                onClick={() => setCurrentStep('demographic')}
                disabled={!canProceedFromLocation()}
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Demographic Data */}
      {currentStep === 'demographic' && (
        <Card>
          <CardHeader>
            <CardTitle>Dados Demográficos</CardTitle>
            <CardDescription>
              Colete as informações básicas do entrevistado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Faixa Etária</Label>
                <Select 
                  value={interview.demographicData.age} 
                  onValueChange={(value) => handleDemographicChange('age', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16-24">16 a 24 anos</SelectItem>
                    <SelectItem value="25-34">25 a 34 anos</SelectItem>
                    <SelectItem value="35-44">35 a 44 anos</SelectItem>
                    <SelectItem value="45-54">45 a 54 anos</SelectItem>
                    <SelectItem value="55-64">55 a 64 anos</SelectItem>
                    <SelectItem value="65+">65 anos ou mais</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gender">Gênero</Label>
                <Select 
                  value={interview.demographicData.gender} 
                  onValueChange={(value) => handleDemographicChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="nao-binario">Não-binário</SelectItem>
                    <SelectItem value="prefere-nao-responder">Prefere não responder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="education">Escolaridade</Label>
                <Select 
                  value={interview.demographicData.education} 
                  onValueChange={(value) => handleDemographicChange('education', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fundamental-incompleto">Fundamental Incompleto</SelectItem>
                    <SelectItem value="fundamental-completo">Fundamental Completo</SelectItem>
                    <SelectItem value="medio-incompleto">Médio Incompleto</SelectItem>
                    <SelectItem value="medio-completo">Médio Completo</SelectItem>
                    <SelectItem value="superior-incompleto">Superior Incompleto</SelectItem>
                    <SelectItem value="superior-completo">Superior Completo</SelectItem>
                    <SelectItem value="pos-graduacao">Pós-graduação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="income">Renda Familiar</Label>
                <Select 
                  value={interview.demographicData.income} 
                  onValueChange={(value) => handleDemographicChange('income', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ate-1sm">Até 1 salário mínimo</SelectItem>
                    <SelectItem value="1-2sm">1 a 2 salários mínimos</SelectItem>
                    <SelectItem value="2-5sm">2 a 5 salários mínimos</SelectItem>
                    <SelectItem value="5-10sm">5 a 10 salários mínimos</SelectItem>
                    <SelectItem value="10-20sm">10 a 20 salários mínimos</SelectItem>
                    <SelectItem value="acima-20sm">Acima de 20 salários mínimos</SelectItem>
                    <SelectItem value="nao-respondeu">Não respondeu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="neighborhood">Bairro de Residência</Label>
                <Input 
                  id="neighborhood"
                  value={interview.demographicData.neighborhood}
                  onChange={(e) => handleDemographicChange('neighborhood', e.target.value)}
                  placeholder="Ex: Vila Madalena"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('location')}>
                Voltar
              </Button>
              <Button 
                variant="electoral" 
                onClick={() => setCurrentStep('questions')}
                disabled={!canProceedFromDemographic()}
              >
                Iniciar Questionário
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Questions */}
      {currentStep === 'questions' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Pergunta {currentQuestion + 1} de {questions.length}
                </CardTitle>
                <CardDescription>
                  {questions[currentQuestion].randomizeOptions && (
                    <span className="flex items-center space-x-1 text-xs">
                      <Shuffle className="h-3 w-3" />
                      <span>Opções randomizadas para evitar viés</span>
                    </span>
                  )}
                </CardDescription>
              </div>
              <Badge variant="outline">
                {questions[currentQuestion].required ? 'Obrigatória' : 'Opcional'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">
                {questions[currentQuestion].text}
              </h3>

              {questions[currentQuestion].type === 'radio' && (
                <RadioGroup
                  value={interview.answers[questions[currentQuestion].id] || ''}
                  onValueChange={(value) => handleAnswer(questions[currentQuestion].id, value)}
                >
                  {getQuestionOptions(questions[currentQuestion]).map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {questions[currentQuestion].type === 'textarea' && (
                <Textarea
                  value={interview.answers[questions[currentQuestion].id] || ''}
                  onChange={(e) => handleAnswer(questions[currentQuestion].id, e.target.value)}
                  placeholder="Digite a resposta do entrevistado..."
                  rows={4}
                />
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevQuestion}>
                Anterior
              </Button>
              <Button 
                variant="electoral" 
                onClick={nextQuestion}
                disabled={questions[currentQuestion].required && !canAnswerCurrentQuestion()}
              >
                {currentQuestion === questions.length - 1 ? 'Revisar' : 'Próxima'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review and Submit */}
      {currentStep === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle>Revisar Entrevista</CardTitle>
            <CardDescription>
              Confira todas as respostas antes de enviar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Demographic Summary */}
            <div>
              <h4 className="font-medium mb-3">Dados Demográficos</h4>
              <div className="grid grid-cols-2 gap-2 text-sm bg-muted p-4 rounded-lg">
                <div>Idade: {interview.demographicData.age}</div>
                <div>Gênero: {interview.demographicData.gender}</div>
                <div>Escolaridade: {interview.demographicData.education}</div>
                <div>Renda: {interview.demographicData.income}</div>
                <div className="col-span-2">Bairro: {interview.demographicData.neighborhood}</div>
              </div>
            </div>

            {/* Answers Summary */}
            <div>
              <h4 className="font-medium mb-3">Respostas do Questionário</h4>
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">
                      {index + 1}. {question.text}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {interview.answers[question.id] || 'Não respondida'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Info */}
            {location && (
              <div>
                <h4 className="font-medium mb-3">Informações de Localização</h4>
                <div className="text-sm bg-muted p-4 rounded-lg">
                  <p>Coordenadas: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                  <p>Horário: {interview.startTime.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('questions')}>
                Editar Respostas
              </Button>
              <div className="space-x-2">
                <Button variant="outline">
                  <Save className="h-4 w-4" />
                  Salvar Rascunho
                </Button>
                <Button variant="electoral" onClick={submitInterview}>
                  <Send className="h-4 w-4" />
                  Enviar Entrevista
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
