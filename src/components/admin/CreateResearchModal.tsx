import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, FileText, MapPin, Users, Zap } from "lucide-react";

interface CreateResearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'electoral' | 'evaluation' | 'demographic';
  questions: number;
  estimatedTime: string;
  targetAudience: string;
}

export const CreateResearchModal = ({ open, onOpenChange }: CreateResearchModalProps) => {
  const [currentStep, setCurrentStep] = useState<'type' | 'config' | 'sample' | 'team'>('type');
  const [researchType, setResearchType] = useState<'template' | 'custom'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: '',
    population: '',
    marginError: '3',
    confidence: '95',
    expectedProportion: '50'
  });

  // Sample calculation
  const calculateSample = () => {
    const N = parseInt(formData.population) || 100000;
    const e = parseFloat(formData.marginError) / 100;
    const z = formData.confidence === '95' ? 1.96 : 2.58;
    const p = parseFloat(formData.expectedProportion) / 100;
    
    const numerator = Math.pow(z, 2) * p * (1 - p);
    const denominator = Math.pow(e, 2);
    const n0 = numerator / denominator;
    const n = Math.ceil(n0 / (1 + (n0 - 1) / N));
    
    return n;
  };

  const templates: Template[] = [
    {
      id: 'intention-vote',
      name: 'Intenção de Voto',
      description: 'Pesquisa de intenção de voto estimulada e espontânea para eleições',
      category: 'electoral',
      questions: 15,
      estimatedTime: '8-12 min',
      targetAudience: 'Eleitores aptos'
    },
    {
      id: 'government-evaluation',
      name: 'Avaliação de Gestão',
      description: 'Avaliação da performance de gestores públicos (prefeito, governador, presidente)',
      category: 'evaluation',
      questions: 20,
      estimatedTime: '10-15 min',
      targetAudience: 'População geral'
    },
    {
      id: 'candidate-rejection',
      name: 'Rejeição de Candidatos',
      description: 'Medição do índice de rejeição e antipolarização de candidatos',
      category: 'electoral',
      questions: 12,
      estimatedTime: '6-10 min',
      targetAudience: 'Eleitores aptos'
    },
    {
      id: 'demographic-profile',
      name: 'Perfil Demográfico',
      description: 'Levantamento completo do perfil socioeconômico e demográfico',
      category: 'demographic',
      questions: 25,
      estimatedTime: '15-20 min',
      targetAudience: 'População geral'
    },
    {
      id: 'public-policies',
      name: 'Políticas Públicas',
      description: 'Avaliação da percepção sobre políticas públicas específicas',
      category: 'evaluation',
      questions: 18,
      estimatedTime: '12-16 min',
      targetAudience: 'Usuários de serviços públicos'
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'electoral': return 'primary';
      case 'evaluation': return 'secondary';
      case 'demographic': return 'info';
      default: return 'secondary';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'electoral': return 'Eleitoral';
      case 'evaluation': return 'Avaliação';
      case 'demographic': return 'Demográfico';
      default: return category;
    }
  };

  const handleNext = () => {
    const steps = ['type', 'config', 'sample', 'team'] as const;
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps = ['type', 'config', 'sample', 'team'] as const;
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleCreate = () => {
    // Here you would handle the creation logic
    console.log('Creating research with data:', {
      type: researchType,
      template: selectedTemplate,
      ...formData,
      sampleSize: calculateSample()
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Criar Nova Pesquisa</DialogTitle>
          <DialogDescription>
            Configure sua pesquisa eleitoral em alguns passos simples
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 mb-6">
          {[
            { id: 'type', label: 'Tipo', icon: FileText },
            { id: 'config', label: 'Configuração', icon: MapPin },
            { id: 'sample', label: 'Amostra', icon: Calculator },
            { id: 'team', label: 'Equipe', icon: Users }
          ].map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = ['type', 'config', 'sample', 'team'].indexOf(currentStep) > index;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isActive ? 'bg-primary text-primary-foreground' :
                  isCompleted ? 'bg-success text-success-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`ml-2 text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
                {index < 3 && <div className="w-8 h-px bg-border mx-4" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Type Selection */}
        {currentStep === 'type' && (
          <div className="space-y-6">
            <Tabs value={researchType} onValueChange={(value) => setResearchType(value as 'template' | 'custom')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="template">Usar Template</TabsTrigger>
                <TabsTrigger value="custom">Criar do Zero</TabsTrigger>
              </TabsList>
              
              <TabsContent value="template" className="space-y-4">
                <div className="grid gap-4">
                  {templates.map((template) => (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <CardDescription className="mt-1">{template.description}</CardDescription>
                          </div>
                          <Badge variant={getCategoryColor(template.category) as any}>
                            {getCategoryLabel(template.category)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{template.questions} perguntas</span>
                          <span>•</span>
                          <span>{template.estimatedTime}</span>
                          <span>•</span>
                          <span>{template.targetAudience}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pesquisa Personalizada</CardTitle>
                    <CardDescription>
                      Crie uma pesquisa completamente do zero com suas próprias perguntas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="custom-name">Nome da Pesquisa</Label>
                        <Input 
                          id="custom-name" 
                          placeholder="Ex: Pesquisa Municipal Personalizada"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="custom-description">Descrição</Label>
                        <Textarea 
                          id="custom-description" 
                          placeholder="Descreva o objetivo e escopo da pesquisa"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Step 2: Configuration */}
        {currentStep === 'config' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração Geográfica</CardTitle>
                <CardDescription>Defina a localização e população-alvo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Select value={formData.city} onValueChange={(value) => setFormData({...formData, city: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sao-paulo">São Paulo - SP</SelectItem>
                        <SelectItem value="rio-janeiro">Rio de Janeiro - RJ</SelectItem>
                        <SelectItem value="brasilia">Brasília - DF</SelectItem>
                        <SelectItem value="salvador">Salvador - BA</SelectItem>
                        <SelectItem value="fortaleza">Fortaleza - CE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="population">População Total</Label>
                    <Input 
                      id="population" 
                      type="number"
                      placeholder="Ex: 12000000"
                      value={formData.population}
                      onChange={(e) => setFormData({...formData, population: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parâmetros Estatísticos</CardTitle>
                <CardDescription>Configure a precisão e confiabilidade da pesquisa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="margin-error">Margem de Erro (%)</Label>
                    <Select value={formData.marginError} onValueChange={(value) => setFormData({...formData, marginError: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2%</SelectItem>
                        <SelectItem value="3">3%</SelectItem>
                        <SelectItem value="4">4%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="confidence">Nível de Confiança</Label>
                    <Select value={formData.confidence} onValueChange={(value) => setFormData({...formData, confidence: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90%</SelectItem>
                        <SelectItem value="95">95%</SelectItem>
                        <SelectItem value="99">99%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="proportion">Proporção Esperada (%)</Label>
                    <Input 
                      id="proportion"
                      type="number"
                      min="1"
                      max="99"
                      value={formData.expectedProportion}
                      onChange={(e) => setFormData({...formData, expectedProportion: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Sample Calculation */}
        {currentStep === 'sample' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Cálculo da Amostra</span>
                </CardTitle>
                <CardDescription>
                  Baseado nos parâmetros configurados, calculamos automaticamente o tamanho da amostra
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Parâmetros Configurados</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cidade:</span>
                        <span className="font-medium">{formData.city || 'Não selecionada'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">População:</span>
                        <span className="font-medium">{parseInt(formData.population || '0').toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Margem de Erro:</span>
                        <span className="font-medium">±{formData.marginError}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confiança:</span>
                        <span className="font-medium">{formData.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Resultado do Cálculo</h4>
                    <div className="p-6 bg-primary-light rounded-lg text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {calculateSample().toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-primary">entrevistas necessárias</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Este cálculo considera a fórmula estatística padrão para populações finitas, 
                      garantindo a representatividade da amostra com os parâmetros definidos.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição Geográfica</CardTitle>
                <CardDescription>O sistema distribuirá automaticamente as entrevistas pelos bairros da cidade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Distribuição proporcional por população de cada bairro</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Zap className="h-4 w-4 text-secondary" />
                    <span>Geração automática de mapa interativo para pesquisadores</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-info" />
                    <span>Controle de quota por região com GPS</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Team Assignment */}
        {currentStep === 'team' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Atribuição de Equipe</CardTitle>
                <CardDescription>Selecione os pesquisadores responsáveis pela coleta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {[
                    { id: '1', name: 'Maria Silva', email: 'maria@example.com', status: 'active', experience: 'Senior' },
                    { id: '2', name: 'João Santos', email: 'joao@example.com', status: 'active', experience: 'Pleno' },
                    { id: '3', name: 'Ana Costa', email: 'ana@example.com', status: 'active', experience: 'Junior' }
                  ].map((researcher) => (
                    <div key={researcher.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <input type="checkbox" className="w-4 h-4" />
                        <div>
                          <h4 className="font-medium">{researcher.name}</h4>
                          <p className="text-sm text-muted-foreground">{researcher.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{researcher.experience}</Badge>
                        <Badge variant={researcher.status === 'active' ? 'default' : 'secondary'}>
                          {researcher.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cronograma da Pesquisa</CardTitle>
                <CardDescription>Configure as datas de início e término</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Data de Início</Label>
                    <Input id="start-date" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="end-date">Data de Término</Label>
                    <Input id="end-date" type="date" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex space-x-2">
            {currentStep !== 'type' && (
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {currentStep === 'team' ? (
              <Button variant="electoral" onClick={handleCreate}>
                Criar Pesquisa
              </Button>
            ) : (
              <Button 
                variant="electoral" 
                onClick={handleNext}
                disabled={
                  (currentStep === 'type' && researchType === 'template' && !selectedTemplate) ||
                  (currentStep === 'config' && (!formData.city || !formData.population))
                }
              >
                Próximo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};