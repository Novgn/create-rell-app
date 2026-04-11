'use client';

// Example form — React Hook Form + Zod (Story 4.2).
//
// This is a minimal, working example of the pattern the architecture spec
// mandates for every form in the generated app:
//
//   1. Zod schema lives in `shared/` (one source of truth for field rules)
//   2. TypeScript type comes from `z.infer<>` — never hand-written
//   3. RHF does the wiring, `zodResolver` hands RHF the schema
//   4. Errors render inline per-field (accessible, localized, no toast)
//
// Wire `onSubmit` to your API route or Server Action — the logged payload is
// already the validated, coerced output of the schema.

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useForm } from 'react-hook-form';

import {
  profileFormSchema,
  type ProfileFormValues,
} from '@{{projectNameKebab}}/shared';

export function ProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: standardSchemaResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      bio: '',
      website: '',
    },
  });

  function onSubmit(values: ProfileFormValues) {
    // Replace this with a real API call or Server Action. The `values`
    // argument is guaranteed to match the schema — Zod has already parsed
    // and coerced it for you.
    console.log('profile form submit', values);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="profile-display-name">Display name</label>
        <input
          id="profile-display-name"
          type="text"
          autoComplete="nickname"
          aria-invalid={errors.displayName ? 'true' : 'false'}
          {...register('displayName')}
        />
        {errors.displayName && (
          <p role="alert">{errors.displayName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="profile-bio">Bio</label>
        <textarea
          id="profile-bio"
          rows={3}
          aria-invalid={errors.bio ? 'true' : 'false'}
          {...register('bio')}
        />
        {errors.bio && <p role="alert">{errors.bio.message}</p>}
      </div>

      <div>
        <label htmlFor="profile-website">Website</label>
        <input
          id="profile-website"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://example.com"
          aria-invalid={errors.website ? 'true' : 'false'}
          {...register('website')}
        />
        {errors.website && <p role="alert">{errors.website.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
