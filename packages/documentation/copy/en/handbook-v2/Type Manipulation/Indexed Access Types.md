---
title: Indexed Access Types
layout: docs
permalink: /docs/handbook/2/indexed-access-types.html
oneline: "Using Type['a'] syntax to access a subset of a type."
---

We can use an _indexed access type_ to look up a specific property on another type:

```ts twoslash
type Person = { age: number; name: string; alive: boolean };
type Age = Person["age"];
//   ^?
```

The indexing type is itself a type, so we can use unions, `keyof`, or other types entirely:

```ts twoslash
type Person = { age: number; name: string; alive: boolean };
// ---cut---
type I1 = Person["age" | "name"];
//   ^?

type I2 = Person[keyof Person];
//   ^?

type AliveOrName = "alive" | "name";
type I3 = Person[AliveOrName];
//   ^?
```

You'll even see an error if you try to index a property that doesn't exist:

```ts twoslash
// @errors: 2339
type Person = { age: number; name: string; alive: boolean };
// ---cut---
type I1 = Person["alve"];
```

> Solving **No index signature with a parameter of type 'string' was found on type** Error
> 
> The error "No index signature with a parameter of type 'string' was found on type" occurs when we use a value of type 
> string to index an object with specific keys. To solve the error, type the `string` as one of the object's keys using
> `keyof typeof obj`.
> 
> ![Error loading no-index-signature-with-parameter-found.png](/TypeScript-Website/images/docs/no-index-signature-with-parameter-found.png)
> 
> Here is an example of how the error occurs.
> 
> ```ts
> const key = 'country' as string;
> 
> const obj = {
> name: 'Bobby Hadz',
> country: 'Germany',
> };
> 
> // ⛔️ Error:  No index signature with a parameter of type
> // 'string' was found on type '{ name: string; country: string; }'.ts(7053)
> console.log(obj[key]);
> ```
> 
> The `key` variable has a type of string and this could be any string. We got the error when we tried to access an
> object that has name and country properties.
> 
> **TypeScript is complaining that the `string` type is too broad and not all strings are keys in the object. We have to 
> make sure the specific string is one of the object's keys.
> 
> **The first way to solve the error is to use a
> [type assertion](/docs/handbook/2/everyday-types.html#type-assertions).**
> 
> ```ts
> const key = 'country' as string;
> 
> const obj = {
> name: 'Bobby Hadz',
> country: 'Germany',
> };
> 
> // 👇️ "Germany"
> console.log(obj[key as keyof typeof obj]);
> ```
> 
> We used a type assertion to indicate to TypeScript that the `key` variable is not of type `string`, but rather it is a 
> union type containing only the keys of the object. With that, TypeScript lets us access the property without throwing
> the error.

Another example of indexing with an arbitrary type is using `number` to get the type of an array's elements.
We can combine this with `typeof` to conveniently capture the element type of an array literal:

```ts twoslash
const MyArray = [
  { name: "Alice", age: 15 },
  { name: "Bob", age: 23 },
  { name: "Eve", age: 38 },
];

type Person = typeof MyArray[number];
//   ^?
type Age = typeof MyArray[number]["age"];
//   ^?
// Or
type Age2 = Person["age"];
//   ^?
```

You can only use types when indexing, meaning you can't use a `const` to make a variable reference:

```ts twoslash
// @errors: 2538 2749
type Person = { age: number; name: string; alive: boolean };
// ---cut---
const key = "age";
type Age = Person[key];
```

However, you can use a type alias for a similar style of refactor:

```ts twoslash
type Person = { age: number; name: string; alive: boolean };
// ---cut---
type key = "age";
type Age = Person[key];
```
