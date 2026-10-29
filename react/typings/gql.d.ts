declare module '*.gql' {
  import { DocumentNode } from 'graphql'

  const Schema: DocumentNode

  export default Schema
}

declare module '*.graphql' {
  import { DocumentNode } from 'graphql'

  const schema: DocumentNode

  export default schema
}

declare module '*.json' {
  const value: any
  export default value
}
