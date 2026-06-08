import React from 'react';
import { Input, Select, Textarea } from './Input.jsx';
import { Button } from './Button.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card.jsx';

export const Form = ({ children, className = '', onSubmit, ...props }) => {
  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`} {...props}>
      {children}
    </form>
  );
};

export const FormGroup = ({ children, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {children}
  </div>
);

export const FormLabel = ({ children, required = false, className = '' }) => (
  <label className={`text-sm font-medium text-[#1E293B] ${className}`}>
    {children}
    {required && <span className='text-[#EF4444] ml-1'>*</span>}
  </label>
);

export const FormField = ({ label, error, children, required = false, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {label && <FormLabel required={required}>{label}</FormLabel>}
    {children}
    {error && <span className='text-xs text-[#EF4444]'>{error}</span>}
  </div>
);

export const FormActions = ({ children, className = '' }) => (
  <div className={`flex items-center gap-3 pt-4 ${className}`}>
    {children}
  </div>
);

export const ModernForm = ({ 
  title, 
  description, 
  fields, 
  onSubmit, 
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = React.useState({});
  const [errors, setErrors] = React.useState({});

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors = {};
    fields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} es requerido`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleSubmit}>
          <div className='space-y-4'>
            {fields.map((field) => (
              <FormField
                key={field.name}
                label={field.label}
                error={errors[field.name]}
                required={field.required}
              >
                {field.type === 'select' ? (
                  <Select
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    options={field.options || []}
                    placeholder={field.placeholder}
                  />
                ) : field.type === 'textarea' ? (
                  <Textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    rows={field.rows || 4}
                  />
                ) : (
                  <Input
                    type={field.type || 'text'}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </FormField>
            ))}
          </div>
          
          <FormActions>
            {onCancel && (
              <Button 
                variant='outline' 
                type='button'
                onClick={onCancel}
                disabled={loading}
              >
                {cancelText}
              </Button>
            )}
            <Button 
              variant='primary' 
              type='submit'
              disabled={loading}
            >
              {loading ? 'Procesando...' : submitText}
            </Button>
          </FormActions>
        </Form>
      </CardContent>
    </Card>
  );
};
