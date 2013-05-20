get.scores <- function (n.students = 1, as=-2, bs=2, student.prior=1, 
                        test.items = c(-2,-1,1,2),
                        to.plot = FALSE, verbose = FALSE) {
  # create data frame
  #   n = 1
  #   as = -2
  #   bs = 2
  #   student.prior = 1
  
  d <- data.frame(labels=c(rep(FALSE,length(as)),rep(TRUE,length(bs))),
                  teacher.values=c(as,bs))
  
  student.sds <- rgamma(n.students,student.prior)
  
  # make student observations
  obs <- adply(student.sds, 1, function(x) {
    ds <- d
    ds$observed <- sapply(ds$teacher.values,function(y) {
      rnorm(1,mean=y,sd=x)})
    ds$sd <- x
    
    return(ds)
  })
  names(obs)[names(obs)=="X1"] <- "student"
  
  # now generate student data
  preds <- ddply(obs, .(student), 
                 function(x) {
                   g <- glm(labels ~ observed,
                            data=x,
                            family="binomial")
                   xs <- seq(-4,4,.05)
                   preds <- data.frame(observed=xs)
                   preds$y.hat <- predict(g,preds)
                   preds$p <- inv.logit(preds$y.hat)
                   preds$sd <- x$sd[1]
                   return(preds)})
  
  
  # now test them with the test items
  scores <- ddply(preds,.(student), function(x) {
    y <- data.frame(student=x$student[1],
                    sd = x$sd[1],
                    score = mean(round(x$p[x$observed %in% test.items]) == 
                                   (test.items>0)))
    return(y)})
  
  if (verbose) {
    test <- subset(preds,observed %in% test.items)
    test$true <- round(test$p) == (test.items > 0)
    print(test)
    print(scores)
  }
  
  if (to.plot) {
    q <- qplot(observed,p,facets= ~ student,
               geom="line",data=preds) + 
      geom_vline(xintercept=0,color="black",lty=2) + 
      geom_point(data=obs,
                 aes(x=observed,y=0,colour=labels))
    print(q)
  }
  
  return(na.mean(scores$score))
}
