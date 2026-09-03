/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useEffect, useState, useRef } from 'react'
import Image from 'vtex.store-image/Image'
import { useDevice } from 'vtex.device-detector'
import { Dropdown } from 'vtex.styleguide'
import { useProduct } from 'vtex.product-context'

import RichText from './RichText'
import styles from './style.css'

interface TableOptions {
  title: string
  value: string
  value2?: string
  value3?: string
  value4?: string
}

interface Option {
  image: string
  imageMobile: string
  title: string
  tableOptions: TableOptions[]
}

interface SizeGuideProps {
  mainImage?: string
  mainImageMobile?: string
  options?: Option[]
}

// Extendemos el tipo de React.FC para permitir schema y defaultProps
interface SizeGuideComponent<P = {}> extends React.FC<P> {
  schema?: object
  defaultProps?: Partial<P>
}

const EMPTY_OPTION: Option = {
  image: '',
  imageMobile: '',
  title: '',
  tableOptions: [],
}

const SizeGuide: SizeGuideComponent<SizeGuideProps> = ({
  mainImage = '',
  mainImageMobile = '',
  options = [],
}) => {
  const { product } = useProduct() ?? {}
  const [category, setCategory] = useState<Option>(EMPTY_OPTION)
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { isMobile } = useDevice()
  const overlayRef = useRef<HTMLDivElement>(null)

  // --- Filtrado avanzado de opciones ---
  useEffect(() => {
    if (!options?.length) return

    const firstCategory = product?.categories?.[0]?.toLowerCase() ?? ''

    if (!firstCategory) return

    const matchedOptions = options.filter(({ title }) => {
      const [rawPath] = title.split(' -')
      const normalizedPath = rawPath.trim().toLowerCase()

      return (
        firstCategory.includes(normalizedPath) ||
        normalizedPath.includes(firstCategory)
      )
    })

    setFilteredOptions(matchedOptions)
    // Mantiene 'category' en EMPTY_OPTION para mostrar la imagen por defecto primero
    setCategory(EMPTY_OPTION)
  }, [options, product?.categories])

  // --- Obtiene la imagen según el estado ---
  const getMainImage = () => {
    const initialImage = isMobile
      ? mainImageMobile || mainImage || '/arquivos/size-imagen.png'
      : mainImage || '/arquivos/size-imagen.png'

    if (!category.title) {
      return initialImage
    }

    if (category.image) {
      return isMobile ? category.imageMobile || category.image : category.image
    }

    return initialImage
  }

  const handleCategorySelection = (_: any, value: string) => {
    const selectedCategory =
      options.find((option) => option.title === value) ?? EMPTY_OPTION

    setCategory(selectedCategory)
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      setIsOpen(false)
    }
  }

  // --- Si no hay coincidencias, no renderiza nada ---
  if (!filteredOptions.length) {
    return null
  }

  return (
    <div className={styles.sgContainer}>
      {/* Botón que abre el modal */}
      <button className={styles.sgOpenBtn} onClick={() => setIsOpen(true)}>
        Guía de tallas
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className={isOpen ? styles.sgOverlayOpen : styles.sgOverlay}
          ref={overlayRef}
          onMouseDown={handleOverlayClick}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={isOpen ? styles.sgModalOpen : styles.sgModal}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className={styles.sgClose}
              aria-label="Cerrar"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>

            <div className={styles.sgModalContent}>
              <div className={styles.sgImage}>
                <Image
                  src={getMainImage()}
                  alt={category.title || 'Guía de tallas'}
                />
              </div>

              <div className={styles.sgSelector}>
                <Dropdown
                  options={filteredOptions.map((option) => {
                    const [path, label] = option.title.split(' -')

                    return {
                      value: option.title,
                      label:
                        label?.trim() || path.split('/').pop() || option.title,
                    }
                  })}
                  value={category.title}
                  placeholder="Selecciona una opción"
                  onChange={handleCategorySelection}
                />

                {/* La tabla se renderiza solo tras seleccionar una opción */}
                {category.title !== '' && (
                  <ul className={styles.sgOptions}>
                    {category.tableOptions.map((option, idx) => (
                      <li
                        className={styles.sgOption}
                        key={`${option.title ?? 'row'}-${idx}`}
                      >
                        <p className={styles.sgOptionTitle}>
                          <RichText text={option.title} />
                        </p>

                        <p className={styles.sgOptionValue}>
                          <RichText text={option.value} />
                        </p>

                        {option.value2 && (
                          <p className={styles.sgOptionValue}>
                            <RichText text={option.value2} />
                          </p>
                        )}
                        {option.value3 && (
                          <p className={styles.sgOptionValue}>
                            <RichText text={option.value3} />
                          </p>
                        )}
                        {option.value4 && (
                          <p className={styles.sgOptionValue}>
                            <RichText text={option.value4} />
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Configuración CMS ---
SizeGuide.schema = {
  title: 'Guía de tallas',
  description: 'Guía de tallas con lógica avanzada de categoría',
  type: 'object',
}

SizeGuide.defaultProps = {
  options: [],
}

export default SizeGuide