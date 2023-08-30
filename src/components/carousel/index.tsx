import type{ PropsWithChildren, ComponentProps, ReactElement } from 'react'
import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useMemo,
  Children,
  cloneElement,
  useCallback,
} from 'react'
import { CarouselInterface, CarouselItem, CarouselOptions, Carousel as FlowbiteCarousel, IndicatorItem } from 'flowbite';
import ScrollContainer from 'react-indiana-drag-scroll';

export interface CarouselProps extends PropsWithChildren<ComponentProps<'div'>> {
  id: string;
  type: 'static' | 'slide';
  showControls?: boolean;
  showIndicators?: boolean;
  className?: string;
  intervalDuration?: number;
  defaultPosition?: number;
  slidesWrapperClassName?: string;
  activeItemPosition?: number;
  durationClassName?: string;
  scrollable?: boolean;
  onNext?: (index: number) => void;
  onPrev?: (index: number) => void;
  onSlideChange?: (index: number) => void;
}
export const Carousel = React.forwardRef(({
  id =  'liquid-carousel',
  type = 'slide',
  className = '',
  intervalDuration = 3000,
  defaultPosition = 0,
  durationClassName = 'duration-1000',
  slidesWrapperClassName = '',
  activeItemPosition = 0,
  showControls = true,
  showIndicators = true,
  scrollable = false,
  onNext,
  onPrev,
  onSlideChange,
  children,
}: CarouselProps, ref: any) => {
  const uniqueId = useMemo(() => id + Math.random().toString(36).substr(2, 9), [])
  const carouselContainer = useRef<HTMLDivElement>(null)
  const [activelyScrolling, setActivelyScrolling] = useState(type === 'slide')
  const [prevScrollPos, setPrevScrollPos] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)
  const [activeIndex, setActiveIndex] = useState(activeItemPosition)
  const [carousel, setCarousel] = useState<CarouselInterface | null>(null)

  useImperativeHandle(ref, () => ({
    carousel,
    next() {
      carousel?.next()
    },
    prev() {
      carousel?.prev()
    },
    slideTo(index: number) {
      carousel?.slideTo(index)
    },
    cycle(){
      carousel?.cycle()
    },
    pause(){
      carousel?.pause()
    }
  }))

  const slides = useMemo(
    () =>
      Children.map(children as ReactElement[], (child: ReactElement, index) =>
        cloneElement(child, {
          ...child.props,
          key: child.props.id || `carousel-item-${index + 1}`,
        }),
      ),
    [children],
  );

  const navigateTo = useCallback(
    (item: number) => () => {
      if (!slides) return;
      item = (item + slides.length) % slides.length;
      setActiveIndex(item);
      onSlideChange?.(item)
      carousel?.slideTo(item);
    },
    [slides, carousel],
  );

  const initCarousel = () => {
    const options: CarouselOptions = {
      defaultPosition,
      interval: intervalDuration,
      indicators: showIndicators ? {
        activeClasses: 'bg-white dark:bg-gray-800',
        inactiveClasses: 'bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800',
        items: slides.map((_, index) => {
          const el = document.getElementById(`${uniqueId}-carousel-indicator-${index}`)
          return  {
            position: index,
            el,
          } as IndicatorItem
        }).filter(Boolean),
      } : undefined,
      onNext: (carouselInstance: CarouselInterface) => {
        navigateTo(carouselInstance._activeItem.position)
      },
      onPrev: (carouselInstance: CarouselInterface) => {
        navigateTo(carouselInstance._activeItem.position)
      },
      onChange: (carouselInstance: CarouselInterface) => {
        navigateTo(carouselInstance._activeItem.position)
      },
    };
    const items: CarouselItem[] = slides.map((_, index) => ({
      position: index,
      el: document.getElementById(`${uniqueId}-carousel-item-${index}`)!,
    }))
    const carouselInstance = new FlowbiteCarousel(items, options)
    if (type === 'slide') {
      carouselInstance.cycle()
    }
    setCarousel(carouselInstance)
  }

  useEffect(() => {
    if (carousel) return
    initCarousel()
  }, [])

  /** Scroll handling */
  useEffect(() => {
    if (carouselContainer.current && !isDragging && scrollable) {
      const currentScrollPos = carouselContainer.current.scrollLeft;
      // Determine the scroll direction
      if (currentScrollPos > prevScrollPos) {
        carousel?.next();
        // TODO: Fix extra scroll on right scroll
        setTimeout(() => {
          // carouselContainer.current.scrollTo({
          //   left: currentScrollPos,
          //   behavior: 'smooth',
          // });
        }, 0);
      } else if (carousel) {
        carousel?.prev();
      }
    }
  }, [isDragging, prevScrollPos, scrollable])


  const handleDragging = useCallback((dragging: boolean) => () => {
    if (!scrollable) return

    if (!activelyScrolling) {
      setActivelyScrolling(true);
      carousel?.pause();
    }
    if (dragging && carouselContainer.current) {
      setPrevScrollPos(carouselContainer.current.scrollLeft);
    }
    setIsDragging(dragging)
  }, [activelyScrolling, scrollable, carousel]);

  return (
    <div id={uniqueId} className={`relative w-full h-full ${className}`}>
      <ScrollContainer
        stopPropagation
        horizontal={scrollable}
        vertical={false}
        nativeMobileScroll
        innerRef={carouselContainer}
        onStartScroll={handleDragging(true)}
        onEndScroll={handleDragging(false)}
        draggingClassName="cursor-grabbing"
        className={`relative overflow-y-hidden rounded-lg h-full snap-x ${slidesWrapperClassName}`}>
        {slides.map((slide, index) => (
          <div key={index} className="duration-700 ease-in-out" id={`${uniqueId}-carousel-item-${index}`}>
            {slide}
          </div>
        ))}
      </ScrollContainer>
      {showIndicators && (
        <div className="absolute z-30 flex space-x-3 -translate-x-1/2 bottom-5 left-1/2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              id={`${uniqueId}-carousel-indicator-${index}`}
              className="w-3 h-3 rounded-full"
              aria-current={activeIndex === index}
              aria-label={`Slide ${index + 1}`}
              data-carousel-slide-to={index}
              onClick={() => navigateTo(index)()}
            />
          ))}
        </div>
      )}
      {showControls && (
        <>
          <button
            onClick={navigateTo(activeIndex - 1)}
            type="button"
            className="absolute top-0 left-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
          >
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
              <DefaultLeftIcon />
              <span className="sr-only">Previous</span>
            </span>
          </button>
          <button
            onClick={navigateTo(activeIndex + 1)}
            type="button"
            className="absolute top-0 right-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
          >
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
              <DefaultRightIcon />
              <span className="sr-only">Next</span>
            </span>
          </button>
        </>
      )}
    </div>
  )
})

const DefaultLeftIcon = () => (
  <svg className="w-4 h-4 text-white dark:text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1 1 5l4 4" />
  </svg>
)

const DefaultRightIcon = () => (
  <svg className="w-4 h-4 text-white dark:text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
  </svg>
)

export default Carousel