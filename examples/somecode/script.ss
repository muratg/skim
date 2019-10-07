#!/usr/bin/env skim

(let* ()
  (define make-counter
    (lambda ()
      (let ((next 0))
        (lambda ()
          (let ((v next))
            (set! next (+ next 1))
            v)))))
  (define count1 (make-counter))
(define count2 (make-counter))

(count1)
(count1)
(count1)
(count2)
(count2)

(quote 1)
(quote #t)
(quote (1 2 3 "hello"))
(quote "a")

(display "Hello!") (newline)
)
