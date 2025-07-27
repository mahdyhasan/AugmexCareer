import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { FormField as FormFieldType } from "@/types";

interface DynamicFormProps {
  fields: FormFieldType[];
  onSubmit: (data: any) => void;
  loading?: boolean;
  submitText?: string;
}

export function DynamicForm({ fields, onSubmit, loading, submitText = "Submit" }: DynamicFormProps) {
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({});

  // Create dynamic schema based on fields
  const createSchema = () => {
    const schemaFields: any = {};
    
    fields.forEach((field) => {
      let fieldSchema: any;
      
      switch (field.type) {
        case 'email':
          fieldSchema = z.string().email('Invalid email address');
          break;
        case 'phone':
          fieldSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number');
          break;
        case 'select':
        case 'radio':
          fieldSchema = z.string();
          break;
        case 'multiselect':
          fieldSchema = z.array(z.string());
          break;
        case 'checkbox':
          fieldSchema = z.boolean();
          break;
        case 'file':
          fieldSchema = z.any().optional();
          break;
        default:
          fieldSchema = z.string();
      }
      
      if (field.required && field.type !== 'checkbox') {
        fieldSchema = fieldSchema.min(1, `${field.label} is required`);
      }
      
      if (field.validation?.min) {
        fieldSchema = fieldSchema.min(field.validation.min);
      }
      
      if (field.validation?.max) {
        fieldSchema = fieldSchema.max(field.validation.max);
      }
      
      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }
      
      schemaFields[field.id] = fieldSchema;
    });
    
    return z.object(schemaFields);
  };

  const schema = createSchema();
  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: fields.reduce((acc, field) => {
      if (field.type === 'multiselect') {
        acc[field.id as keyof FormData] = [] as any;
      } else if (field.type === 'checkbox') {
        acc[field.id as keyof FormData] = false as any;
      } else {
        acc[field.id as keyof FormData] = '' as any;
      }
      return acc;
    }, {} as FormData),
  });

  const handleFileChange = (fieldId: string, file: File | null) => {
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [fieldId]: file }));
    } else {
      setUploadedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[fieldId];
        return newFiles;
      });
    }
  };

  const handleSubmit = (data: FormData) => {
    const formData = new FormData();
    
    // Add form fields
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    
    // Add files
    Object.entries(uploadedFiles).forEach(([key, file]) => {
      formData.append(key, file);
    });
    
    onSubmit(formData);
  };

  const renderField = (field: FormFieldType) => {
    switch (field.type) {
      case 'textarea':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={field.placeholder}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'select':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'radio':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={formField.onChange}
                    defaultValue={formField.value}
                  >
                    {field.options?.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                        <label htmlFor={`${field.id}-${option}`}>{option}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'checkbox':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id as any}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'file':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept={field.validation?.fileTypes?.join(',')}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      handleFileChange(field.id, file || null);
                      formField.onChange(file);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {fields.map(renderField)}
        
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Submitting..." : submitText}
        </Button>
      </form>
    </Form>
  );
}
